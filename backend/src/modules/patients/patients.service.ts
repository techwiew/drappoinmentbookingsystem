import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';

export class PatientService {
  static async listPatients(
    clinicId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      doctorId?: string;
    }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { clinicId };

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s } },
        { mobile: { contains: s } },
        { patientNumber: { contains: s } },
        { email: { contains: s } },
      ];
    }

    if (query.doctorId && query.doctorId !== 'ALL') {
      where.patientDoctors = {
        some: {
          doctorId: query.doctorId,
          status: 'ACTIVE',
        },
      };
    }

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patientDoctors: {
            where: { status: 'ACTIVE' },
            include: {
              doctor: {
                select: {
                  id: true,
                  name: true,
                  specialization: true,
                },
              },
            },
          },
          _count: {
            select: {
              appointments: true,
              consultations: true,
              prescriptions: true,
            },
          },
        },
      }),
    ]);

    return {
      patients: patients.map((p) => ({
        id: p.id,
        patientNumber: p.patientNumber,
        fullName: p.fullName,
        age: p.age,
        gender: p.gender,
        mobile: p.mobile,
        email: p.email,
        bloodGroup: p.bloodGroup,
        allergies: p.allergies,
        existingIllness: p.existingIllness,
        assignedDoctors: p.patientDoctors.map((pd) => ({
          id: pd.doctor.id,
          name: pd.doctor.name,
          specialization: pd.doctor.specialization,
        })),
        totalVisits: p._count.appointments,
        totalConsultations: p._count.consultations,
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async checkDuplicate(
    clinicId: string,
    query: {
      mobile?: string;
      patientNumber?: string;
      fullName?: string;
    }
  ) {
    const conditions: any[] = [];
    if (query.mobile) {
      conditions.push({ mobile: query.mobile.trim() });
    }
    if (query.patientNumber) {
      conditions.push({ patientNumber: query.patientNumber.trim() });
    }
    if (query.fullName && query.fullName.length >= 3) {
      conditions.push({ fullName: { contains: query.fullName.trim() } });
    }

    if (conditions.length === 0) {
      return { matches: [] };
    }

    const matches = await prisma.patient.findMany({
      where: {
        clinicId,
        OR: conditions,
      },
      take: 5,
      include: {
        patientDoctors: {
          include: {
            doctor: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return {
      matches: matches.map((m) => ({
        id: m.id,
        patientNumber: m.patientNumber,
        fullName: m.fullName,
        gender: m.gender,
        age: m.age,
        mobile: m.mobile,
        bloodGroup: m.bloodGroup,
        assignedDoctors: m.patientDoctors.map((pd) => pd.doctor.name),
        createdAt: m.createdAt,
      })),
    };
  }

  static async createPatient(clinicId: string, data: any, creatorUserId: string) {
    // Generate sequential patientNumber within clinic
    const count = await prisma.patient.count({ where: { clinicId } });
    const patientNumber = `P-${1001 + count}`;

    // Get clinic doctors to handle single-doctor auto-assignment
    const clinicDoctors = await prisma.doctor.findMany({
      where: { clinicId, status: 'ACTIVE' },
    });

    let assignedDoctorIds: string[] = data.doctorIds || [];
    if (assignedDoctorIds.length === 0 && clinicDoctors.length === 1) {
      // Auto-assign if only 1 doctor exists
      assignedDoctorIds = [clinicDoctors[0].id];
    }

    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          clinicId,
          patientNumber,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          age: data.age || null,
          gender: data.gender || 'MALE',
          mobile: data.mobile,
          email: data.email || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          pincode: data.pincode || null,
          bloodGroup: data.bloodGroup || null,
          allergies: data.allergies || null,
          existingIllness: data.existingIllness || null,
          medicalConditions: data.medicalConditions || null,
          emergencyContactName: data.emergencyContactName || null,
          emergencyContactRelationship: data.emergencyContactRelationship || null,
          emergencyContactMobile: data.emergencyContactMobile || null,
          notes: data.notes || null,
        },
      });

      for (const docId of assignedDoctorIds) {
        await tx.patientDoctor.create({
          data: {
            clinicId,
            patientId: patient.id,
            doctorId: docId,
            assignedBy: creatorUserId,
          },
        });
      }

      return patient;
    });

    await logAudit({
      clinicId,
      userId: creatorUserId,
      action: 'PATIENT_CREATED',
      entityType: 'Patient',
      entityId: result.id,
      metadata: { patientNumber: result.patientNumber, fullName: result.fullName },
    });

    return this.getPatientById(clinicId, result.id);
  }

  static async getPatientById(clinicId: string, patientId: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      include: {
        patientDoctors: {
          where: { status: 'ACTIVE' },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                qualification: true,
                consultationFee: true,
              },
            },
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10,
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
          },
        },
        consultations: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
            prescription: {
              include: { items: true },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this clinic' };
    }

    return {
      ...patient,
      assignedDoctors: patient.patientDoctors.map((pd) => ({
        id: pd.doctor.id,
        name: pd.doctor.name,
        specialization: pd.doctor.specialization,
        qualification: pd.doctor.qualification,
        consultationFee: Number(pd.doctor.consultationFee),
      })),
      consultations: patient.consultations.map((c) => ({
        id: c.id,
        appointmentId: c.appointmentId,
        doctorId: c.doctorId,
        doctorName: c.doctor.name,
        doctorSpecialization: c.doctor.specialization,
        chiefComplaint: c.chiefComplaint,
        symptoms: c.symptoms,
        diagnosis: c.diagnosis,
        doctorNotes: c.doctorNotes,
        advice: c.advice,
        testsRecommended: c.testsRecommended,
        nextVisitDate: c.nextVisitDate,
        followUpNotes: c.followUpNotes,
        status: c.status,
        createdAt: c.createdAt,
        prescription: c.prescription
          ? {
              id: c.prescription.id,
              prescribedAt: c.prescription.prescribedAt,
              items: c.prescription.items.map((item) => ({
                id: item.id,
                medicineName: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions,
              })),
            }
          : null,
      })),
      payments: patient.payments.map((p) => ({
        id: p.id,
        consultationFee: Number(p.consultationFee),
        additionalFee: Number(p.additionalFee),
        discount: Number(p.discount),
        totalAmount: Number(p.totalAmount),
        paidAmount: Number(p.paidAmount),
        pendingAmount: Number(p.pendingAmount),
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        transactionReference: p.transactionReference,
        createdAt: p.createdAt,
      })),
    };
  }

  static async updatePatient(clinicId: string, patientId: string, data: any, updaterUserId: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found' };
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.mobile && { mobile: data.mobile }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.age !== undefined && { age: data.age }),
        ...(data.gender && { gender: data.gender }),
        ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.state !== undefined && { state: data.state || null }),
        ...(data.pincode !== undefined && { pincode: data.pincode || null }),
        ...(data.allergies !== undefined && { allergies: data.allergies || null }),
        ...(data.existingIllness !== undefined && { existingIllness: data.existingIllness || null }),
        ...(data.medicalConditions !== undefined && { medicalConditions: data.medicalConditions || null }),
        ...(data.emergencyContactName !== undefined && { emergencyContactName: data.emergencyContactName || null }),
        ...(data.emergencyContactRelationship !== undefined && { emergencyContactRelationship: data.emergencyContactRelationship || null }),
        ...(data.emergencyContactMobile !== undefined && { emergencyContactMobile: data.emergencyContactMobile || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    await logAudit({
      clinicId,
      userId: updaterUserId,
      action: 'PATIENT_UPDATED',
      entityType: 'Patient',
      entityId: patientId,
    });

    return updated;
  }

  static async assignDoctor(clinicId: string, patientId: string, doctorId: string, assignerUserId: string) {
    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } });
    if (!patient) throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found' };

    const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, clinicId } });
    if (!doctor) throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' };

    const existing = await prisma.patientDoctor.findUnique({
      where: { patientId_doctorId: { patientId, doctorId } },
    });

    if (existing) {
      if (existing.status !== 'ACTIVE') {
        await prisma.patientDoctor.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE' },
        });
      }
      return { success: true, message: 'Doctor already assigned' };
    }

    await prisma.patientDoctor.create({
      data: {
        clinicId,
        patientId,
        doctorId,
        assignedBy: assignerUserId,
      },
    });

    await logAudit({
      clinicId,
      userId: assignerUserId,
      action: 'DOCTOR_ASSIGNED',
      entityType: 'Patient',
      entityId: patientId,
      metadata: { doctorId },
    });

    return { success: true };
  }

  static async removeDoctor(clinicId: string, patientId: string, doctorId: string, unassignerUserId: string) {
    await prisma.patientDoctor.deleteMany({
      where: {
        clinicId,
        patientId,
        doctorId,
      },
    });

    await logAudit({
      clinicId,
      userId: unassignerUserId,
      action: 'DOCTOR_UNASSIGNED',
      entityType: 'Patient',
      entityId: patientId,
      metadata: { doctorId },
    });

    return { success: true };
  }
}
