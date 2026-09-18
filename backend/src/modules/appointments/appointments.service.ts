import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';
import { getCurrentAppointmentTime, normalizeAppointmentTime } from '../../utils/time.js';

export class AppointmentService {
  private static normalizeDateString(dateString: any): string {
    if (typeof dateString !== 'string') {
      // If it's not a string, we assume it's already a Date object or something else that Prisma can handle.
      return dateString;
    }
    // If the string already contains a time part, return as is.
    if (dateString.includes('T') || dateString.includes(':')) {
      return dateString;
    }
    // Otherwise, assume it's a date in YYYY-MM-DD format and append time.
    return `${dateString}T00:00:00.000Z`;
  }

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
      reasonForVisit: appointment.reasonForVisit,
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
      where.appointmentDate = AppointmentService.normalizeDateString(query.date);
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
        reasonForVisit: a.reasonForVisit,
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

    // Calculate next token number for this clinic + doctor + date
    const normalizedDate = AppointmentService.normalizeDateString(data.appointmentDate);
    const existingTokens = await prisma.appointment.count({
      where: {
        clinicId,
        doctorId: data.doctorId,
        appointmentDate: normalizedDate,
      },
    });

    const tokenNumber = existingTokens + 1;
    const consultationFee =
      data.consultationFee !== undefined
        ? data.consultationFee
        : Number(doctor.consultationFee);
    // A follow-up can be recorded before the patient has confirmed a slot.
    // Keep that appointment untimed instead of silently assigning the current time.
    const appointmentTime = data.appointmentTime
      ? normalizeAppointmentTime(data.appointmentTime)
      : data.appointmentType === 'FOLLOW_UP'
        ? null
        : normalizeAppointmentTime(getCurrentAppointmentTime(2));
    if (appointmentTime) {
      const [, hourText, minuteText, meridiem] = appointmentTime.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/)!;
      const hour = Number(hourText) % 12 + (meridiem === 'PM' ? 12 : 0);
      const [year, month, day] = data.appointmentDate.split('-').map(Number);
      const scheduled = new Date(year, month - 1, day, hour, Number(minuteText));
      if (scheduled.getTime() < Date.now() + 2 * 60 * 1000) {
        throw { statusCode: 400, code: 'APPOINTMENT_TOO_SOON', message: 'Appointment time must be at least two minutes from now' };
      }
    }
    const initialStatus = data.directCheckIn
      ? 'CHECKED_IN'
      : data.appointmentType === 'FOLLOW_UP' && !appointmentTime
        ? 'PENDING_CONFIRMATION'
        : 'BOOKED';

    const appointment = await prisma.appointment.create({
      data: {
        clinicId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: normalizedDate,
        appointmentTime,
        appointmentType: data.appointmentType || 'NEW_PATIENT',
        tokenNumber,
        status: initialStatus,
        consultationFee,
        notes: data.notes || null,
        reasonForVisit: data.reasonForVisit || data.notes || null,
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

    if (data.status && ['COMPLETED', 'IN_CONSULTATION', 'CANCELLED'].includes(appointment.status)) {
      throw { statusCode: 409, code: 'APPOINTMENT_CLOSED', message: 'This appointment status cannot be changed' };
    }

    const updateData: any = {};
    if (data.appointmentDate) {
      updateData.appointmentDate = data.appointmentDate;
    }
    if (data.appointmentTime !== undefined) {
      updateData.appointmentTime = data.appointmentTime
        ? normalizeAppointmentTime(data.appointmentTime)
        : null;
    }
    if (data.appointmentType) updateData.appointmentType = data.appointmentType;
    if (data.status) updateData.status = data.status;
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.reasonForVisit !== undefined) updateData.reasonForVisit = data.reasonForVisit;
    if (data.doctorId) {
      const doctor = await prisma.doctor.findFirst({ where: { id: data.doctorId, clinicId, status: 'ACTIVE' } });
      if (!doctor) throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this clinic' };
      updateData.doctorId = data.doctorId;
    }

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
      where: { id: appointmentId, clinicId, status: { in: ['PENDING_CONFIRMATION', 'BOOKED', 'CHECKED_IN', 'WAITING', 'READY_FOR_DOCTOR'] } },
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
