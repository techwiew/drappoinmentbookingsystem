import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';
import { calculatePaymentBalance } from './payment-balance.js';

export class BillingService {
  static async listPayments(
    clinicId: string,
    query: {
      date?: string;
      status?: string;
      search?: string;
      appointmentId?: string;
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
      where.paymentStatus = query.status === 'PENDING'
        ? { in: ['PENDING', 'PARTIALLY_PAID'] }
        : query.status;
    }

    if (query.appointmentId) {
      where.appointmentId = query.appointmentId;
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
        excessAmount: Math.max(0, Number(p.paidAmount) - Number(p.totalAmount)),
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
    const paidAmount = Number(data.paidAmount || 0);
    if (paidAmount <= 0) {
      throw { statusCode: 400, code: 'INVALID_PAYMENT_AMOUNT', message: 'Payment amount must be greater than zero' };
    }

    const patient = await prisma.patient.findFirst({ where: { id: data.patientId, clinicId }, select: { id: true } });
    if (!patient) throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this clinic' };
    let doctorId: string | null = data.doctorId || null;
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: { id: data.appointmentId, clinicId, patientId: data.patientId },
        select: { doctorId: true },
      });
      if (!appointment) throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found for this patient in this clinic' };
      doctorId = appointment.doctorId;
    } else if (doctorId) {
      const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, clinicId }, select: { id: true } });
      if (!doctor) throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this clinic' };
    }

    const payment = await prisma.$transaction(async (tx) => {
    let payment;
    // If appointmentId is provided, check for existing payment record for that appointment
    if (data.appointmentId) {
      const existingPayment = await tx.payment.findFirst({
        where: {
          appointmentId: data.appointmentId,
          clinicId,
        },
      });

      if (existingPayment) {
        const totalAmount = Number(existingPayment.totalAmount);
        const balance = calculatePaymentBalance(totalAmount, Number(existingPayment.paidAmount) + paidAmount);

        payment = await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            paidAmount: balance.paidAmount,
            pendingAmount: balance.pendingAmount,
            paymentStatus: balance.paymentStatus,
            // Note: we do not update consultationFee, additionalFee, discount, totalAmount as they are part of the invoice
            // Update paymentMethod and transactionReference only if provided? We'll update them to the new values.
            paymentMethod: data.paymentMethod || existingPayment.paymentMethod,
            transactionReference: data.transactionReference || existingPayment.transactionReference,
          },
          include: {
            patient: true,
            doctor: true,
          },
        });
      } else {
        const consultationFee = Number(data.consultationFee || 0);
        const additionalFee = Number(data.additionalFee || 0);
        const discount = Number(data.discount || 0);
        const balance = calculatePaymentBalance(Math.max(0, consultationFee + additionalFee - discount), paidAmount);
        // No existing payment, create new
        payment = await tx.payment.create({
          data: {
            clinicId,
            patientId: data.patientId,
            appointmentId: data.appointmentId || null,
            doctorId,
            consultationFee,
            additionalFee,
            discount,
            totalAmount: balance.totalAmount,
            paidAmount: balance.paidAmount,
            pendingAmount: balance.pendingAmount,
            paymentMethod: data.paymentMethod || 'CASH',
            paymentStatus: balance.paymentStatus,
            transactionReference: data.transactionReference || null,
          },
          include: {
            patient: true,
            doctor: true,
          },
        });
      }
    } else {
      const consultationFee = Number(data.consultationFee || 0);
      const additionalFee = Number(data.additionalFee || 0);
      const discount = Number(data.discount || 0);
      const balance = calculatePaymentBalance(Math.max(0, consultationFee + additionalFee - discount), paidAmount);
      // No appointmentId, create new payment (should not happen in normal flow)
      payment = await tx.payment.create({
        data: {
          clinicId,
          patientId: data.patientId,
          appointmentId: data.appointmentId || null,
          doctorId,
          consultationFee,
          additionalFee,
          discount,
          totalAmount: balance.totalAmount,
          paidAmount: balance.paidAmount,
          pendingAmount: balance.pendingAmount,
          paymentMethod: data.paymentMethod || 'CASH',
          paymentStatus: balance.paymentStatus,
          transactionReference: data.transactionReference || null,
        },
        include: {
          patient: true,
          doctor: true,
        },
      });
    }
    await tx.paymentReceipt.create({ data: { clinicId, paymentId: payment.id, doctorId, amount: paidAmount } });
    return payment;
    });

    await logAudit({
      clinicId,
      userId: creatorUserId,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: {
        totalAmount: Number(payment.totalAmount),
        paidAmount: payment.paidAmount,
        paymentMethod: payment.paymentMethod,
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
      excessAmount: Math.max(0, Number(payment.paidAmount) - Number(payment.totalAmount)),
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
    const balance = calculatePaymentBalance(totalAmount, paidAmount);

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.payment.update({
      where: { id: paymentId },
      data: {
        additionalFee,
        discount,
        totalAmount: balance.totalAmount,
        paidAmount: balance.paidAmount,
        pendingAmount: balance.pendingAmount,
        paymentStatus: balance.paymentStatus,
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.transactionReference !== undefined && { transactionReference: data.transactionReference }),
      },
      });
      const adjustment = balance.paidAmount - Number(payment.paidAmount);
      if (adjustment !== 0) {
        await tx.paymentReceipt.create({ data: { clinicId, paymentId, doctorId: payment.doctorId, amount: adjustment } });
      }
      return saved;
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
      excessAmount: Math.max(0, Number(payment.paidAmount) - Number(payment.totalAmount)),
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionReference: payment.transactionReference,
      createdAt: payment.createdAt,
    };
  }
}
