import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';

export class BillingService {
  static async listPayments(
    clinicId: string,
    query: {
      date?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { clinicId };

    if (query.date) {
      const d = new Date(query.date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      where.createdAt = {
        gte: d,
        lt: nextDay,
      };
    }

    if (query.status && query.status !== 'ALL') {
      where.paymentStatus = query.status;
    }

    if (query.search) {
      where.OR = [
        { patient: { fullName: { contains: query.search } } },
        { patient: { mobile: { contains: query.search } } },
        { patient: { patientNumber: { contains: query.search } } },
        { transactionReference: { contains: query.search } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              fullName: true,
              mobile: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
          appointment: {
            select: {
              id: true,
              tokenNumber: true,
              appointmentDate: true,
            },
          },
        },
      }),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        patientId: p.patientId,
        patientNumber: p.patient.patientNumber,
        patientName: p.patient.fullName,
        patientMobile: p.patient.mobile,
        doctorId: p.doctorId,
        doctorName: p.doctor?.name || 'Clinic Staff',
        appointmentId: p.appointmentId,
        tokenNumber: p.appointment?.tokenNumber || null,
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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async recordPayment(clinicId: string, data: any, creatorUserId: string) {
    const consultationFee = Number(data.consultationFee || 0);
    const additionalFee = Number(data.additionalFee || 0);
    const discount = Number(data.discount || 0);
    const totalAmount = Math.max(0, consultationFee + additionalFee - discount);
    const paidAmount = Number(data.paidAmount || 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);

    let paymentStatus = 'PENDING';
    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const payment = await prisma.payment.create({
      data: {
        clinicId,
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        doctorId: data.doctorId || null,
        consultationFee,
        additionalFee,
        discount,
        totalAmount,
        paidAmount,
        pendingAmount,
        paymentMethod: data.paymentMethod || 'CASH',
        paymentStatus,
        transactionReference: data.transactionReference || null,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    await logAudit({
      clinicId,
      userId: creatorUserId,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: {
        totalAmount,
        paidAmount,
        paymentMethod: data.paymentMethod,
      },
    });

    return {
      ...payment,
      consultationFee: Number(payment.consultationFee),
      additionalFee: Number(payment.additionalFee),
      discount: Number(payment.discount),
      totalAmount: Number(payment.totalAmount),
      paidAmount: Number(payment.paidAmount),
      pendingAmount: Number(payment.pendingAmount),
    };
  }

  static async updatePayment(clinicId: string, paymentId: string, data: any, updaterUserId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, clinicId },
    });
    if (!payment) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Payment record not found' };
    }

    const consultationFee = Number(payment.consultationFee);
    const additionalFee = data.additionalFee !== undefined ? Number(data.additionalFee) : Number(payment.additionalFee);
    const discount = data.discount !== undefined ? Number(data.discount) : Number(payment.discount);
    const totalAmount = Math.max(0, consultationFee + additionalFee - discount);
    const paidAmount = data.paidAmount !== undefined ? Number(data.paidAmount) : Number(payment.paidAmount);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);

    let paymentStatus = payment.paymentStatus;
    if (data.paymentStatus) {
      paymentStatus = data.paymentStatus;
    } else if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        additionalFee,
        discount,
        totalAmount,
        paidAmount,
        pendingAmount,
        paymentStatus,
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.transactionReference !== undefined && { transactionReference: data.transactionReference }),
      },
    });

    await logAudit({
      clinicId,
      userId: updaterUserId,
      action: 'PAYMENT_UPDATED',
      entityType: 'Payment',
      entityId: paymentId,
    });

    return updated;
  }

  static async getReceipt(clinicId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, clinicId },
      include: {
        clinic: true,
        patient: true,
        doctor: true,
        appointment: true,
      },
    });

    if (!payment) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Payment receipt not found' };
    }

    return {
      receiptNumber: `REC-${payment.id.slice(0, 8).toUpperCase()}`,
      clinic: {
        name: payment.clinic.name,
        address: payment.clinic.address,
        phone: payment.clinic.phone,
        email: payment.clinic.email,
        logo: payment.clinic.logo,
      },
      patient: {
        id: payment.patient.id,
        patientNumber: payment.patient.patientNumber,
        fullName: payment.patient.fullName,
        mobile: payment.patient.mobile,
      },
      doctor: payment.doctor
        ? {
            name: payment.doctor.name,
            specialization: payment.doctor.specialization,
          }
        : null,
      appointmentToken: payment.appointment?.tokenNumber || null,
      consultationFee: Number(payment.consultationFee),
      additionalFee: Number(payment.additionalFee),
      discount: Number(payment.discount),
      totalAmount: Number(payment.totalAmount),
      paidAmount: Number(payment.paidAmount),
      pendingAmount: Number(payment.pendingAmount),
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionReference: payment.transactionReference,
      createdAt: payment.createdAt,
    };
  }
}
