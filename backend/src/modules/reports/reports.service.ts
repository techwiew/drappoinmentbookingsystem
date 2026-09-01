import { prisma } from '../../lib/prisma.js';

export class ReportsService {
  static async getDoctorDashboard(clinicId: string, doctorId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const whereAppt: any = {
      clinicId,
      appointmentDate: {
        gte: today,
        lt: nextDay,
      },
    };

    if (doctorId && doctorId !== 'ALL') {
      whereAppt.doctorId = doctorId;
    }

    const todayAppointments = await prisma.appointment.findMany({
      where: whereAppt,
      include: {
        patient: true,
        doctor: true,
        payments: true,
        consultation: true,
      },
      orderBy: { tokenNumber: 'asc' },
    });

    const totalToday = todayAppointments.length;
    const waitingCount = todayAppointments.filter((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN').length;
    const inConsultationCount = todayAppointments.filter((a) => a.status === 'IN_CONSULTATION').length;
    const completedCount = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
    const noShowCount = todayAppointments.filter((a) => a.status === 'NO_SHOW').length;
    const newPatientsCount = todayAppointments.filter((a) => a.appointmentType === 'NEW_PATIENT').length;
    const returningPatientsCount = todayAppointments.filter((a) => a.appointmentType === 'FOLLOW_UP').length;

    // Today's collections
    const todayPayments = await prisma.payment.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: today,
          lt: nextDay,
        },
        ...(doctorId && doctorId !== 'ALL' ? { doctorId } : {}),
      },
    });

    const todayCollection = todayPayments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const pendingPayments = todayPayments.reduce((sum, p) => sum + Number(p.pendingAmount), 0);

    // Follow-ups due today
    const followUpsDue = await prisma.consultation.findMany({
      where: {
        clinicId,
        nextVisitDate: {
          gte: today,
          lt: nextDay,
        },
        ...(doctorId && doctorId !== 'ALL' ? { doctorId } : {}),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Last 7 days revenue trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastPayments = await prisma.payment.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: sevenDaysAgo,
        },
        ...(doctorId && doctorId !== 'ALL' ? { doctorId } : {}),
      },
      select: {
        paidAmount: true,
        createdAt: true,
        paymentMethod: true,
      },
    });

    const dailyRevenueMap: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenueMap[dateStr] = 0;
    }

    pastPayments.forEach((p) => {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      if (dailyRevenueMap[dateStr] !== undefined) {
        dailyRevenueMap[dateStr] += Number(p.paidAmount);
      }
    });

    const revenueTrends = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue),
    }));

    return {
      kpis: {
        totalToday,
        waitingCount,
        inConsultationCount,
        completedCount,
        noShowCount,
        newPatientsCount,
        returningPatientsCount,
        todayCollection: Math.round(todayCollection),
        pendingPayments: Math.round(pendingPayments),
        followUpsCount: followUpsDue.length,
      },
      todayAppointments: todayAppointments.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patient.fullName,
        patientNumber: a.patient.patientNumber,
        patientMobile: a.patient.mobile,
        doctorId: a.doctorId,
        doctorName: a.doctor.name,
        tokenNumber: a.tokenNumber,
        appointmentTime: a.appointmentTime,
        appointmentType: a.appointmentType,
        status: a.status,
        consultationFee: Number(a.consultationFee),
        consultationId: a.consultation?.id || null,
      })),
      followUpsDue: followUpsDue.map((f) => ({
        id: f.id,
        patientName: f.patient.fullName,
        patientNumber: f.patient.patientNumber,
        patientMobile: f.patient.mobile,
        doctorName: f.doctor.name,
        diagnosis: f.diagnosis,
      })),
      revenueTrends,
    };
  }

  static async getReceptionistDashboard(clinicId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const doctors = await prisma.doctor.findMany({
      where: { clinicId, status: 'ACTIVE' },
      include: {
        appointments: {
          where: {
            appointmentDate: {
              gte: today,
              lt: nextDay,
            },
          },
          include: { patient: true },
          orderBy: { tokenNumber: 'asc' },
        },
      },
    });

    const todayPayments = await prisma.payment.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: today,
          lt: nextDay,
        },
      },
    });

    const todayCollection = todayPayments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const totalAppointments = doctors.reduce((sum, d) => sum + d.appointments.length, 0);
    const waitingTokens = doctors.reduce(
      (sum, d) => sum + d.appointments.filter((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN').length,
      0
    );
    const completedTokens = doctors.reduce(
      (sum, d) => sum + d.appointments.filter((a) => a.status === 'COMPLETED').length,
      0
    );

    return {
      kpis: {
        totalAppointments,
        waitingTokens,
        completedTokens,
        todayCollection: Math.round(todayCollection),
        activeDoctorsCount: doctors.length,
      },
      doctorQueues: doctors.map((d) => ({
        doctorId: d.id,
        doctorName: d.name,
        specialization: d.specialization,
        consultationFee: Number(d.consultationFee),
        totalTokens: d.appointments.length,
        currentConsultation: d.appointments.find((a) => a.status === 'IN_CONSULTATION')?.patient.fullName || null,
        currentTokenNumber: d.appointments.find((a) => a.status === 'IN_CONSULTATION')?.tokenNumber || null,
        nextWaitingPatient: d.appointments.find((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN')?.patient.fullName || null,
        nextWaitingToken: d.appointments.find((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN')?.tokenNumber || null,
        waitingCount: d.appointments.filter((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN').length,
        completedCount: d.appointments.filter((a) => a.status === 'COMPLETED').length,
      })),
    };
  }
}
