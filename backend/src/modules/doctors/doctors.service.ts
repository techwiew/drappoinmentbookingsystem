import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';
import { logAudit } from '../../middlewares/audit.js';

export class DoctorService {
  static async transferAndDeactivate(clinicId: string, doctorId: string, actorUserId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const source = await tx.doctor.findFirst({ where: { id: doctorId, clinicId } });
      if (!source) throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital' };
      const ownerMembership = await tx.clinicUser.findFirst({
        where: { clinicId, isOwner: true, role: 'DOCTOR' },
        include: { user: { include: { doctor: true } } },
      });
      const destination = ownerMembership?.user.doctor;
      if (!destination || destination.clinicId !== clinicId || destination.status !== 'ACTIVE') {
        throw { statusCode: 409, code: 'OWNER_REQUIRED', message: 'An active hospital administrator doctor is required for transfer' };
      }
      if (destination.id === doctorId) {
        throw { statusCode: 409, code: 'OWNER_PROTECTED', message: 'The hospital administrator doctor cannot be removed' };
      }
      const activeConsultations = await tx.appointment.count({ where: { clinicId, doctorId, status: 'IN_CONSULTATION' } });
      const draftConsultations = await tx.consultation.count({ where: { clinicId, doctorId, status: 'DRAFT' } });
      if (activeConsultations || draftConsultations) throw { statusCode: 409, code: 'CONSULTATION_ACTIVE', message: 'Complete active consultations before transferring this doctor' };

      const assignments = await tx.patientDoctor.findMany({ where: { clinicId, doctorId, status: 'ACTIVE' } });
      for (const assignment of assignments) {
        await tx.patientDoctor.upsert({
          where: { patientId_doctorId: { patientId: assignment.patientId, doctorId: destination.id } },
          create: { clinicId, patientId: assignment.patientId, doctorId: destination.id, assignedBy: actorUserId },
          update: { status: 'ACTIVE' },
        });
      }
      await tx.patientDoctor.updateMany({ where: { clinicId, doctorId }, data: { status: 'INACTIVE' } });

      const openAppointments = await tx.appointment.findMany({
        where: {
          clinicId, doctorId,
          status: { in: ['PENDING_CONFIRMATION', 'BOOKED', 'CHECKED_IN', 'WAITING', 'READY_FOR_DOCTOR'] },
        },
        orderBy: [{ appointmentDate: 'asc' }, { tokenNumber: 'asc' }],
      });
      const nextTokens = new Map<string, number>();
      for (const appointment of openAppointments) {
        const day = appointment.appointmentDate.toISOString().slice(0, 10);
        if (!nextTokens.has(day)) {
          const last = await tx.appointment.findFirst({
            where: { clinicId, doctorId: destination.id, appointmentDate: appointment.appointmentDate },
            orderBy: { tokenNumber: 'desc' }, select: { tokenNumber: true },
          });
          nextTokens.set(day, last?.tokenNumber ?? 0);
        }
        const nextToken = (nextTokens.get(day) ?? 0) + 1;
        nextTokens.set(day, nextToken);
        await tx.appointment.update({ where: { id: appointment.id }, data: { doctorId: destination.id, tokenNumber: nextToken } });
      }
      const admissions = await tx.admission.updateMany({
        where: { clinicId, attendingDoctorId: doctorId, status: 'ADMITTED' },
        data: { attendingDoctorId: destination.id },
      });
      await tx.doctor.update({ where: { id: doctorId }, data: { status: 'INACTIVE' } });
      await tx.user.update({ where: { id: source.userId }, data: { status: 'INACTIVE', refreshTokenHash: null } });
      return { doctorId, destinationDoctorId: destination.id, patients: assignments.length, appointments: openAppointments.length, admissions: admissions.count };
    });
    await logAudit({ clinicId, userId: actorUserId, action: 'DOCTOR_TRANSFERRED_AND_DEACTIVATED', entityType: 'Doctor', entityId: doctorId, metadata: result });
    return result;
  }

  static async listDoctors(clinicId: string) {
    const doctors = await prisma.doctor.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            patientDoctors: true,
            appointments: true,
            consultations: true,
          },
        },
      },
    });

    return doctors.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      mobile: d.mobile,
      specialization: d.specialization,
      qualification: d.qualification,
      registrationNumber: d.registrationNumber,
      consultationFee: Number(d.consultationFee),
      status: d.status,
      workingDays: JSON.parse(d.workingDays || '[]'),
      workingHours: JSON.parse(d.workingHours || '{}'),
      assignedPatientsCount: d._count.patientDoctors,
      totalAppointmentsCount: d._count.appointments,
      totalConsultationsCount: d._count.consultations,
      createdAt: d.createdAt,
    }));
  }

  static async createDoctor(clinicId: string, data: any, creatorUserId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingUser) {
      throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'An account with this email address already exists' };
    }
    const existingMobile = await prisma.doctor.findFirst({ where: { clinicId, mobile: data.mobile }, select: { id: true } });
    if (existingMobile) {
      throw { statusCode: 409, code: 'MOBILE_EXISTS', message: 'A doctor with this mobile number is already registered in this clinic' };
    }
    const existingRegistration = await prisma.doctor.findFirst({ where: { clinicId, registrationNumber: data.registrationNumber }, select: { id: true } });
    if (existingRegistration) {
      throw { statusCode: 409, code: 'REGISTRATION_EXISTS', message: 'This medical registration number is already registered in this clinic' };
    }

    const hashedPassword = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.findUnique({ where: { id: clinicId }, select: { maxDoctors: true } });
      if (!clinic) throw { statusCode: 404, code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' };
      const doctorCount = await tx.doctor.count({ where: { clinicId, status: 'ACTIVE' } });
      if (doctorCount >= clinic.maxDoctors) {
        throw { statusCode: 409, code: 'DOCTOR_QUOTA_EXCEEDED', message: `This clinic has reached its limit of ${clinic.maxDoctors} active doctors` };
      }
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash: hashedPassword,
          role: 'DOCTOR',
          status: 'ACTIVE',
        },
      });

      await tx.clinicUser.create({
        data: {
          clinicId,
          userId: user.id,
          role: 'DOCTOR',
          isOwner: false,
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          clinicId,
          userId: user.id,
          name: data.name,
          email: data.email.toLowerCase(),
          mobile: data.mobile,
          specialization: data.specialization,
          qualification: data.qualification,
          registrationNumber: data.registrationNumber,
          consultationFee: data.consultationFee,
          status: 'ACTIVE',
          workingDays: JSON.stringify(data.workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
          workingHours: JSON.stringify(data.workingHours || { start: '09:00', end: '17:00' }),
        },
      });

      return doctor;
    }, { isolationLevel: 'Serializable' });

    await logAudit({
      clinicId,
      userId: creatorUserId,
      action: 'DOCTOR_CREATED',
      entityType: 'Doctor',
      entityId: result.id,
      metadata: { name: result.name, specialization: result.specialization },
    });

    return result;
  }

  static async updateDoctor(clinicId: string, doctorId: string, data: any, updaterUserId: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, clinicId },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this clinic' };
    }

    if (data.status === 'INACTIVE') {
      const membership = await prisma.clinicUser.findUnique({ where: { clinicId_userId: { clinicId, userId: doctor.userId } } });
      if (membership?.isOwner) throw { statusCode: 409, code: 'OWNER_PROTECTED', message: 'The hospital administrator doctor cannot be deactivated' };
      throw { statusCode: 409, code: 'TRANSFER_REQUIRED', message: 'Transfer patients and open work before deactivating this doctor' };
    }

    if (data.status === 'ACTIVE' && doctor.status !== 'ACTIVE') {
      const [clinic, activeDoctors] = await Promise.all([
        prisma.clinic.findUnique({ where: { id: clinicId }, select: { maxDoctors: true } }),
        prisma.doctor.count({ where: { clinicId, status: 'ACTIVE' } }),
      ]);
      if (clinic && activeDoctors >= clinic.maxDoctors) {
        throw { statusCode: 409, code: 'DOCTOR_QUOTA_EXCEEDED', message: `This clinic has reached its limit of ${clinic.maxDoctors} active doctors` };
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.registrationNumber !== undefined) updateData.registrationNumber = data.registrationNumber;
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.workingDays !== undefined) updateData.workingDays = JSON.stringify(data.workingDays);
    if (data.workingHours !== undefined) updateData.workingHours = JSON.stringify(data.workingHours);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedDoctor = await tx.doctor.update({
        where: { id: doctorId },
        data: updateData,
      });

      if (data.status !== undefined) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: { status: data.status },
        });
      }
      if (data.email !== undefined) await tx.user.update({ where: { id: doctor.userId }, data: { email: data.email.toLowerCase() } });

      return updatedDoctor;
    });

    await logAudit({
      clinicId,
      userId: updaterUserId,
      action: 'DOCTOR_UPDATED',
      entityType: 'Doctor',
      entityId: doctorId,
    });

    return updated;
  }

  static async deleteDoctor(clinicId: string, doctorId: string, deleterUserId: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, clinicId },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this clinic' };
    }
    const membership = await prisma.clinicUser.findUnique({ where: { clinicId_userId: { clinicId, userId: doctor.userId } } });
    if (membership?.isOwner) throw { statusCode: 409, code: 'OWNER_PROTECTED', message: 'The hospital administrator doctor cannot be deleted' };

    // Appointment and consultation relations cascade on doctor deletion, so
    // preserve clinical history by refusing to delete a doctor with records.
    const [appointments, consultations, prescriptions, assignedPatients, admissions, payments] = await Promise.all([
      prisma.appointment.count({ where: { doctorId } }),
      prisma.consultation.count({ where: { doctorId } }),
      prisma.prescription.count({ where: { doctorId } }),
      prisma.patientDoctor.count({ where: { doctorId } }),
      prisma.admission.count({ where: { attendingDoctorId: doctorId } }),
      prisma.payment.count({ where: { doctorId } }),
    ]);

    if (appointments || consultations || prescriptions || assignedPatients || admissions || payments) {
      throw {
        statusCode: 409,
        code: 'DOCTOR_HAS_CLINICAL_RECORDS',
        message: 'Transfer active work and deactivate this doctor to preserve clinical and payment history',
      };
    }

    // Deleting the user cascades to its doctor and clinic-user records.
    // Keep the entire operation atomic so a failed delete cannot leave a partial account.
    const deleted = await prisma.$transaction(async (tx) => {
      const removed = await tx.doctor.delete({ where: { id: doctorId } });
      await tx.user.delete({ where: { id: doctor.userId } });
      return removed;
    });

    await logAudit({
      clinicId,
      userId: deleterUserId,
      action: 'DOCTOR_DELETED',
      entityType: 'Doctor',
      entityId: doctorId,
    });

    return deleted;
  }
}
