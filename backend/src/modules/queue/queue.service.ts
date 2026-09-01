import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';

export class QueueService {
  static async getDoctorQueue(clinicId: string, doctorId?: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const where: any = {
      clinicId,
      appointmentDate: {
        gte: targetDate,
        lt: nextDay,
      },
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
      consultationId: a.consultation?.id || null,
      consultationStatus: a.consultation?.status || null,
      paymentStatus: a.payments[0]?.paymentStatus || 'PENDING',
      createdAt: a.createdAt,
    }));

    const currentPatient = mapped.find((a) => a.status === 'IN_CONSULTATION') || null;
    const waitingList = mapped.filter((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN');
    const nextPatient = waitingList[0] || null;
    const completedList = mapped.filter((a) => a.status === 'COMPLETED');
    const skippedList = mapped.filter((a) => a.status === 'SKIPPED');
    const bookedList = mapped.filter((a) => a.status === 'BOOKED');
    const noShowList = mapped.filter((a) => a.status === 'NO_SHOW');

    return {
      date: targetDate.toISOString().split('T')[0],
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

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'WAITING' },
    });

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

  static async startConsultation(clinicId: string, appointmentId: string, doctorUserId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'IN_CONSULTATION' },
    });

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

  static async completeConsultation(clinicId: string, appointmentId: string, doctorUserId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    });

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

  static async skipToken(clinicId: string, appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'SKIPPED' },
    });

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

  static async markNoShow(clinicId: string, appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Appointment not found' };

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'NO_SHOW' },
    });

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
