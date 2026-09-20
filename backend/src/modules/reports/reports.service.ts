import { prisma } from '../../lib/prisma.js';
import { clinicDateKey, clinicReceiptRange, dateOnlyRange } from '../../utils/time.js';

export class ReportsService {
  static async getDoctorDashboard(clinicId: string, doctorId?: string, reportDate = clinicDateKey(new Date())) {
    const { gte: today, lt: nextDay } = clinicReceiptRange(reportDate);
    const appointmentDateRange = dateOnlyRange(reportDate);

    const whereAppt: any = {
      clinicId,
      appointmentDate: appointmentDateRange,
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
    const waitingCount = todayAppointments.filter((a) => ['WAITING', 'CHECKED_IN', 'READY_FOR_DOCTOR'].includes(a.status)).length;
    const inConsultationCount = todayAppointments.filter((a) => a.status === 'IN_CONSULTATION').length;
    const completedCount = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
    const noShowCount = todayAppointments.filter((a) => a.status === 'NO_SHOW').length;
    const bookedCount = todayAppointments.filter((a) => ['BOOKED', 'PENDING_CONFIRMATION'].includes(a.status)).length;
    const otherCount = todayAppointments.filter((a) => ['CANCELLED', 'SKIPPED'].includes(a.status)).length;
    const newPatientsCount = todayAppointments.filter((a) => a.appointmentType === 'NEW_PATIENT').length;
    const returningPatientsCount = todayAppointments.filter((a) => a.appointmentType === 'FOLLOW_UP').length;

    // Today's collections
    const todayPayments = await prisma.payment.findMany({
      where: {
        clinicId,
        createdAt: { gte: today, lt: nextDay },
        ...(doctorId && doctorId !== 'ALL' ? { doctorId } : {}),
      },
    });

    const todayReceipts = await prisma.paymentReceipt.findMany({
      where: { clinicId, createdAt: { gte: today, lt: nextDay }, ...(doctorId && doctorId !== 'ALL' ? { doctorId } : {}) },
      select: { amount: true },
    });
    const todayCollection = todayReceipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    const todayIpdPayments = await prisma.admissionPayment.findMany({
      where: {
        createdAt: { gte: today, lt: nextDay },
        admission: { clinicId },
      },
      select: { amount: true },
    });
    const todayIpdCollection = todayIpdPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const pendingPayments = todayPayments.reduce((sum, p) => sum + Number(p.pendingAmount), 0);

    // Follow-ups due today
    const followUpsDue = await prisma.consultation.findMany({
      where: {
        clinicId,
        nextVisitDate: appointmentDateRange,
        ...(doctorId && doctorId !== 'ALL' ? { doctorId } : {}),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Last 7 days revenue trend
    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    const pastPayments = await prisma.paymentReceipt.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: sevenDaysAgo, lt: nextDay,
        },
        ...(doctorId && doctorId !== 'ALL' ? { doctorId } : {}),
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const pastIpdPayments = await prisma.admissionPayment.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo, lt: nextDay },
        admission: { clinicId },
      },
      select: { amount: true, createdAt: true },
    });

    const dailyRevenueMap: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = clinicDateKey(d);
      dailyRevenueMap[dateStr] = 0;
    }

    pastPayments.forEach((p) => {
      const dateStr = clinicDateKey(p.createdAt);
      if (dailyRevenueMap[dateStr] !== undefined) {
        dailyRevenueMap[dateStr] += Number(p.amount);
      }
    });

    const ipdRevenueMap: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setUTCDate(d.getUTCDate() + i);
      ipdRevenueMap[clinicDateKey(d)] = 0;
    }
    pastIpdPayments.forEach((payment) => {
      const dateStr = clinicDateKey(payment.createdAt);
      if (ipdRevenueMap[dateStr] !== undefined) ipdRevenueMap[dateStr] += Number(payment.amount);
    });

    const revenueTrends = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));
    const ipdRevenueTrends = Object.entries(ipdRevenueMap).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));

    return {
      reportDate,
      kpis: {
        totalToday,
        waitingCount,
        inConsultationCount,
        completedCount,
        noShowCount,
        bookedCount,
        otherCount,
        newPatientsCount,
        returningPatientsCount,
        todayCollection: Math.round(todayCollection * 100) / 100,
        todayIpdCollection: Math.round(todayIpdCollection * 100) / 100,
        pendingPayments: Math.round(pendingPayments * 100) / 100,
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
      ipdRevenueTrends,
    };
  }

  static async getReceptionistDashboard(clinicId: string) {
    const { gte: today, lt: nextDay } = clinicReceiptRange(clinicDateKey(new Date()));
    const appointmentDateRange = dateOnlyRange(clinicDateKey(new Date()));

    const doctors = await prisma.doctor.findMany({
      where: { clinicId, status: 'ACTIVE' },
      include: {
        appointments: {
          where: {
            appointmentDate: appointmentDateRange,
          },
          include: { patient: true },
          orderBy: { tokenNumber: 'asc' },
        },
      },
    });

    const todayPayments = await prisma.payment.findMany({
      where: {
        clinicId,
        createdAt: { gte: today, lt: nextDay },
      },
    });

    const todayReceipts = await prisma.paymentReceipt.findMany({
      where: { clinicId, createdAt: { gte: today, lt: nextDay } },
      select: { amount: true },
    });
    const todayCollection = todayReceipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    const totalAppointments = doctors.reduce((sum, d) => sum + d.appointments.length, 0);
    const waitingTokens = doctors.reduce(
      (sum, d) => sum + d.appointments.filter((a) => ['WAITING', 'CHECKED_IN', 'READY_FOR_DOCTOR'].includes(a.status)).length,
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
        todayCollection: Math.round(todayCollection * 100) / 100,
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
        nextWaitingPatient: d.appointments.find((a) => ['WAITING', 'CHECKED_IN', 'READY_FOR_DOCTOR'].includes(a.status))?.patient.fullName || null,
        nextWaitingToken: d.appointments.find((a) => ['WAITING', 'CHECKED_IN', 'READY_FOR_DOCTOR'].includes(a.status))?.tokenNumber || null,
        waitingCount: d.appointments.filter((a) => ['WAITING', 'CHECKED_IN', 'READY_FOR_DOCTOR'].includes(a.status)).length,
        completedCount: d.appointments.filter((a) => a.status === 'COMPLETED').length,
      })),
    };
  }
}
