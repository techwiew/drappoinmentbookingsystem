import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';
import { getCurrentAppointmentTime, normalizeAppointmentTime } from '../../utils/time.js';

export class AppointmentService {
  static async getAppointmentById(clinicId: string, appointmentId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            fullName: true,
            mobile: true,
            gender: true,
            age: true,
            bloodGroup: true,
            allergies: true,
            existingIllness: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
        consultation: {
          select: {
            id: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' };
    }

    const totalPaid = appointment.payments.reduce((sum, payment) => sum + Number(payment.paidAmount), 0);
    const totalAmount = appointment.payments.length > 0 ? Number(appointment.payments[0].totalAmount) : 0;
    let paymentStatus = 'PENDING';
    if (totalPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    return {
      id: appointment.id,
      patientId: appointment.patientId,
      patientNumber: appointment.patient.patientNumber,
      patientName: appointment.patient.fullName,
      patientMobile: appointment.patient.mobile,
      patientGender: appointment.patient.gender,
      patientAge: appointment.patient.age,
      patientBloodGroup: appointment.patient.bloodGroup,
      patientAllergies: appointment.patient.allergies,
      patientExistingIllness: appointment.patient.existingIllness,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor.name,
      doctorSpecialization: appointment.doctor.specialization,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      tokenNumber: appointment.tokenNumber,
      status: appointment.status,
      consultationFee: Number(appointment.consultationFee),
      notes: appointment.notes,
      consultationId: appointment.consultation?.id || null,
      consultationStatus: appointment.consultation?.status || null,
      paymentStatus,
      createdAt: appointment.createdAt,
    };
  }

  static async listAppointments(
    clinicId: string,
    query: {
      date?: string;
      doctorId?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { clinicId };

    if (query.date) {
      const d = new Date(query.date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      where.appointmentDate = {
        gte: d,
        lt: nextDay,
      };
    }

    if (query.doctorId && query.doctorId !== 'ALL') {
      where.doctorId = query.doctorId;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ appointmentDate: 'asc' }, { tokenNumber: 'asc' }],
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              fullName: true,
              mobile: true,
              gender: true,
              age: true,
              bloodGroup: true,
              allergies: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
          consultation: {
            select: {
              id: true,
              status: true,
            },
          },
          payments: {
            select: {
              id: true,
              totalAmount: true,
              paidAmount: true,
              paymentStatus: true,
            },
          },
        },
      }),
    ]);

    return {
      appointments: appointments.map((a) => {
        const totalPaid = a.payments.reduce((sum, payment) => sum + Number(payment.paidAmount), 0);
        const totalAmount = a.payments.length > 0 ? Number(a.payments[0].totalAmount) : 0;
        let paymentStatus = 'PENDING';
        if (totalPaid >= totalAmount && totalAmount > 0) {
          paymentStatus = 'PAID';
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIALLY_PAID';
        }

        return {
        id: a.id,
        patientId: a.patientId,
        patientNumber: a.patient.patientNumber,
        patientName: a.patient.fullName,
        patientMobile: a.patient.mobile,
        patientGender: a.patient.gender,
        patientAge: a.patient.age,
        patientAllergies: a.patient.allergies,
        doctorId: a.doctorId,
        doctorName: a.doctor.name,
        doctorSpecialization: a.doctor.specialization,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        appointmentType: a.appointmentType,
        tokenNumber: a.tokenNumber,
        status: a.status,
        consultationFee: Number(a.consultationFee),
        notes: a.notes,
        consultationId: a.consultation?.id || null,
        consultationStatus: a.consultation?.status || null,
        paymentStatus,
        createdAt: a.createdAt,
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createAppointment(
    clinicId: string,
    data: any,
    creatorUserId: string
  ) {
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, clinicId },
    });
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this clinic' };
    }

    const doctor = await prisma.doctor.findFirst({
      where: { id: data.doctorId, clinicId },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this clinic' };
    }

    const apptDate = new Date(data.appointmentDate);
    apptDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(apptDate);
    nextDay.setDate(apptDate.getDate() + 1);

    // Calculate next token number for this clinic + doctor + date
    const existingTokens = await prisma.appointment.count({
      where: {
        clinicId,
        doctorId: data.doctorId,
        appointmentDate: {
          gte: apptDate,
          lt: nextDay,
        },
      },
    });

    const tokenNumber = existingTokens + 1;
    const initialStatus = data.directCheckIn ? 'WAITING' : 'BOOKED';
    const consultationFee =
      data.consultationFee !== undefined
        ? data.consultationFee
        : Number(doctor.consultationFee);
    const appointmentTime = normalizeAppointmentTime(data.appointmentTime || getCurrentAppointmentTime());

    const appointment = await prisma.appointment.create({
      data: {
        clinicId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: apptDate,
        appointmentTime,
        appointmentType: data.appointmentType || 'NEW_PATIENT',
        tokenNumber,
        status: initialStatus,
        consultationFee,
        notes: data.notes || null,
        createdBy: creatorUserId,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Ensure doctor is in patient_doctors junction
    await prisma.patientDoctor.upsert({
      where: {
        patientId_doctorId: {
          patientId: data.patientId,
          doctorId: data.doctorId,
        },
      },
      create: {
        clinicId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        assignedBy: creatorUserId,
      },
      update: { status: 'ACTIVE' },
    });

    await logAudit({
      clinicId,
      userId: creatorUserId,
      action: 'APPOINTMENT_CREATED',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: {
        tokenNumber: appointment.tokenNumber,
        patientName: patient.fullName,
        doctorName: doctor.name,
      },
    });

    return appointment;
  }

  static async updateAppointment(
    clinicId: string,
    appointmentId: string,
    data: any,
    updaterUserId: string
  ) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' };
    }

    const updateData: any = {};
    if (data.appointmentDate) {
      const d = new Date(data.appointmentDate);
      d.setHours(0, 0, 0, 0);
      updateData.appointmentDate = d;
    }
    if (data.appointmentTime) updateData.appointmentTime = normalizeAppointmentTime(data.appointmentTime);
    if (data.appointmentType) updateData.appointmentType = data.appointmentType;
    if (data.status) updateData.status = data.status;
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.doctorId) updateData.doctorId = data.doctorId;

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    await logAudit({
      clinicId,
      userId: updaterUserId,
      action: 'APPOINTMENT_UPDATED',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: { newStatus: data.status },
    });

    return updated;
  }

  static async cancelAppointment(
    clinicId: string,
    appointmentId: string,
    cancellerUserId: string
  ) {
    const updated = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId },
      data: { status: 'CANCELLED' },
    });

    if (updated.count === 0) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' };
    }

    await logAudit({
      clinicId,
      userId: cancellerUserId,
      action: 'APPOINTMENT_CANCELLED',
      entityType: 'Appointment',
      entityId: appointmentId,
    });

    return { success: true };
  }
}
