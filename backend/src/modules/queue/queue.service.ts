import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';
import { dateOnlyRange, localDateKey } from '../../utils/time.js';

export class QueueService {
  static async getDoctorQueue(clinicId: string, doctorId?: string, dateStr?: string, doctorView = false) {
    const dateKey = dateStr || localDateKey(new Date());
    const where: any = {
      clinicId,
      appointmentDate: dateOnlyRange(dateKey),
    };

    if (doctorId && doctorId !== 'ALL') {
      where.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { tokenNumber: 'asc' },
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
            consultationFee: true,
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

    const mapped = appointments.map((a) => ({
      id: a.id,
      patientId: a.patientId,
      patientNumber: a.patient.patientNumber,
      patientName: a.patient.fullName,
      patientMobile: a.patient.mobile,
      patientGender: a.patient.gender,
      patientAge: a.patient.age,
      patientBloodGroup: a.patient.bloodGroup,
      patientAllergies: a.patient.allergies,
      patientExistingIllness: a.patient.existingIllness,
      doctorId: a.doctorId,
      doctorName: a.doctor.name,
      doctorSpecialization: a.doctor.specialization,
      tokenNumber: a.tokenNumber,
      appointmentTime: a.appointmentTime,
      appointmentType: a.appointmentType,
      status: a.status,
      consultationFee: Number(a.consultationFee),
      notes: a.notes,
      reasonForVisit: a.reasonForVisit,
      consultationId: a.consultation?.id || null,
      consultationStatus: a.consultation?.status || null,
      paymentStatus: a.payments[0]?.paymentStatus || 'PENDING',
      createdAt: a.createdAt,
    }));

    const currentPatient = mapped.find((a) => a.status === 'IN_CONSULTATION') || null;
    const waitingList = mapped.filter((a) => doctorView
      ? a.status === 'READY_FOR_DOCTOR' || a.status === 'WAITING'
      : ['READY_FOR_DOCTOR', 'WAITING', 'CHECKED_IN'].includes(a.status));
    const nextPatient = waitingList[0] || null;
    const completedList = mapped.filter((a) => a.status === 'COMPLETED');
    const skippedList = mapped.filter((a) => a.status === 'SKIPPED');
    const bookedList = mapped.filter((a) => a.status === 'BOOKED');
    const noShowList = mapped.filter((a) => a.status === 'NO_SHOW');

    return {
      date: dateKey,
      currentPatient,
      nextPatient,
      waitingList,
      completedList,
      skippedList,
      bookedList,
      noShowList,
      allQueue: mapped,
      summary: {
        total: mapped.length,
        waiting: waitingList.length,
        inConsultation: currentPatient ? 1 : 0,
        completed: completedList.length,
        skipped: skippedList.length,
        noShow: noShowList.length,
        booked: bookedList.length,
      },
    };
  }

  static async checkIn(clinicId: string, appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const changed = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId, status: 'BOOKED' },
      data: { status: 'CHECKED_IN' },
    });
    if (!changed.count) throw { statusCode: 409, code: 'NOT_CHECK_IN_ELIGIBLE', message: 'Only a booked appointment can be checked in' };
    const updated = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    await logAudit({
      clinicId,
      userId,
      action: 'QUEUE_CHECK_IN',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: { tokenNumber: appointment.tokenNumber },
    });

    return updated;
  }

  static async sendToDoctor(clinicId: string, appointmentId: string, userId: string) {
    const changed = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId, status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING'] }, doctor: { clinicId, status: 'ACTIVE' } },
      data: { status: 'READY_FOR_DOCTOR' },
    });
    if (!changed.count) throw { statusCode: 409, code: 'NOT_SENDABLE', message: 'This appointment cannot be sent to the doctor' };
    await logAudit({ clinicId, userId, action: 'PATIENT_SENT_TO_DOCTOR', entityType: 'Appointment', entityId: appointmentId });
    return prisma.appointment.findUnique({ where: { id: appointmentId } });
  }

  static async cancel(clinicId: string, appointmentId: string, userId: string) {
    const changed = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId, status: { in: ['PENDING_CONFIRMATION', 'BOOKED', 'CHECKED_IN', 'WAITING', 'READY_FOR_DOCTOR'] } },
      data: { status: 'CANCELLED' },
    });
    if (!changed.count) throw { statusCode: 409, code: 'NOT_CANCELLABLE', message: 'This appointment cannot be cancelled' };
    await logAudit({ clinicId, userId, action: 'APPOINTMENT_CANCELLED', entityType: 'Appointment', entityId: appointmentId });
    return prisma.appointment.findUnique({ where: { id: appointmentId } });
  }

  static async startConsultation(clinicId: string, appointmentId: string, doctorUserId: string, doctorId: string) {
    if (!doctorId) throw { statusCode: 403, code: 'DOCTOR_REQUIRED', message: 'Doctor profile required' };
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId, doctorId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const changed = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId, doctorId, status: { in: ['READY_FOR_DOCTOR', 'WAITING'] } },
      data: { status: 'IN_CONSULTATION' },
    });
    if (!changed.count) throw { statusCode: 409, code: 'NOT_READY', message: 'Reception must send this patient to the doctor first' };
    const updated = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    await logAudit({
      clinicId,
      userId: doctorUserId,
      action: 'CONSULTATION_STARTED',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: { tokenNumber: appointment.tokenNumber },
    });

    return updated;
  }

  static async completeConsultation(clinicId: string, appointmentId: string, doctorUserId: string, doctorId: string) {
    if (!doctorId) throw { statusCode: 403, code: 'DOCTOR_REQUIRED', message: 'Doctor profile required' };
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId, doctorId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const changed = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId, doctorId, status: 'IN_CONSULTATION' },
      data: { status: 'COMPLETED' },
    });
    if (!changed.count) throw { statusCode: 409, code: 'NOT_IN_CONSULTATION', message: 'Consultation has not started' };
    const updated = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    await logAudit({
      clinicId,
      userId: doctorUserId,
      action: 'CONSULTATION_COMPLETED',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: { tokenNumber: appointment.tokenNumber },
    });

    return updated;
  }

  static async skipToken(clinicId: string, appointmentId: string, userId: string, doctorId: string) {
    if (!doctorId) throw { statusCode: 403, code: 'DOCTOR_REQUIRED', message: 'Doctor profile required' };
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId, doctorId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const changed = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId, doctorId, status: { in: ['READY_FOR_DOCTOR', 'WAITING'] } },
      data: { status: 'SKIPPED' },
    });
    if (!changed.count) throw { statusCode: 409, code: 'NOT_READY', message: 'Patient is not in the doctor queue' };
    const updated = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    await logAudit({
      clinicId,
      userId,
      action: 'TOKEN_SKIPPED',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: { tokenNumber: appointment.tokenNumber },
    });

    return updated;
  }

  static async markNoShow(clinicId: string, appointmentId: string, userId: string, doctorId: string) {
    if (!doctorId) throw { statusCode: 403, code: 'DOCTOR_REQUIRED', message: 'Doctor profile required' };
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId, doctorId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const changed = await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId, doctorId, status: { in: ['READY_FOR_DOCTOR', 'WAITING'] } },
      data: { status: 'NO_SHOW' },
    });
    if (!changed.count) throw { statusCode: 409, code: 'NOT_READY', message: 'Patient is not in the doctor queue' };
    const updated = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    await logAudit({
      clinicId,
      userId,
      action: 'TOKEN_NO_SHOW',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: { tokenNumber: appointment.tokenNumber },
    });

    return updated;
  }
}
