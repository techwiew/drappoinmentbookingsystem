import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';

const mapAdmission = (admission: any) => ({
  id: admission.id,
  admissionNumber: admission.admissionNumber,
  patientId: admission.patientId,
  patientNumber: admission.patient.patientNumber,
  patientName: admission.patient.fullName,
  patientMobile: admission.patient.mobile,
  attendingDoctorId: admission.attendingDoctorId,
  attendingDoctorName: admission.attendingDoctor?.name || null,
  admittedAt: admission.admittedAt,
  dischargedAt: admission.dischargedAt,
  status: admission.status,
  roomNumber: admission.roomNumber,
  bedNumber: admission.bedNumber,
  reason: admission.reason,
  diagnosis: admission.diagnosis,
  notes: admission.notes,
  dischargeSummary: admission.dischargeSummary,
  totalAmount: Number(admission.totalAmount),
  paidAmount: Number(admission.paidAmount),
  pendingAmount: Number(admission.pendingAmount),
  payments: admission.payments.map((payment: any) => ({
    id: payment.id,
    amount: Number(payment.amount),
    paymentMethod: payment.paymentMethod,
    transactionReference: payment.transactionReference,
    notes: payment.notes,
    createdAt: payment.createdAt,
  })),
  createdAt: admission.createdAt,
});

const admissionInclude = {
  patient: { select: { id: true, patientNumber: true, fullName: true, mobile: true } },
  attendingDoctor: { select: { id: true, name: true } },
  payments: { orderBy: { createdAt: 'desc' as const } },
};

export class AdmissionService {
  static async listAdmissions(clinicId: string, query: { status?: string; patientId?: string }) {
    const admissions = await prisma.admission.findMany({
      where: {
        clinicId,
        ...(query.status && query.status !== 'ALL' ? { status: query.status } : {}),
        ...(query.patientId ? { patientId: query.patientId } : {}),
      },
      orderBy: [{ status: 'asc' }, { admittedAt: 'desc' }],
      include: admissionInclude,
    });
    return admissions.map(mapAdmission);
  }

  static async admitPatient(clinicId: string, data: any, actorUserId: string) {
    const patient = await prisma.patient.findFirst({ where: { id: data.patientId, clinicId } });
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this clinic' };
    }

    const activeAdmission = await prisma.admission.findFirst({
      where: { clinicId, patientId: data.patientId, status: 'ADMITTED' },
    });
    if (activeAdmission) {
      throw { statusCode: 409, code: 'ALREADY_ADMITTED', message: 'Patient already has an active admission' };
    }

    if (data.attendingDoctorId) {
      const doctor = await prisma.doctor.findFirst({ where: { id: data.attendingDoctorId, clinicId, status: 'ACTIVE' } });
      if (!doctor) {
        throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Attending doctor not found in this clinic' };
      }
    }

    const count = await prisma.admission.count({ where: { clinicId } });
    const admission = await prisma.admission.create({
      data: {
        clinicId,
        patientId: data.patientId,
        attendingDoctorId: data.attendingDoctorId || null,
        admissionNumber: `ADM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`,
        roomNumber: data.roomNumber || null,
        bedNumber: data.bedNumber || null,
        reason: data.reason,
        diagnosis: data.diagnosis || null,
        notes: data.notes || null,
        totalAmount: data.totalAmount || 0,
        pendingAmount: data.totalAmount || 0,
      },
      include: admissionInclude,
    });

    await logAudit({ clinicId, userId: actorUserId, action: 'PATIENT_ADMITTED', entityType: 'Admission', entityId: admission.id });
    return mapAdmission(admission);
  }

  static async updateAdmission(clinicId: string, admissionId: string, data: any, actorUserId: string) {
    const existing = await prisma.admission.findFirst({ where: { id: admissionId, clinicId } });
    if (!existing) throw { statusCode: 404, code: 'ADMISSION_NOT_FOUND', message: 'Admission not found' };
    if (data.attendingDoctorId) {
      const doctor = await prisma.doctor.findFirst({ where: { id: data.attendingDoctorId, clinicId, status: 'ACTIVE' } });
      if (!doctor) throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Attending doctor not found in this clinic' };
    }
    const admission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        ...(data.attendingDoctorId !== undefined && { attendingDoctorId: data.attendingDoctorId || null }),
        ...(data.roomNumber !== undefined && { roomNumber: data.roomNumber || null }),
        ...(data.bedNumber !== undefined && { bedNumber: data.bedNumber || null }),
        ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
      include: admissionInclude,
    });
    await logAudit({ clinicId, userId: actorUserId, action: 'ADMISSION_UPDATED', entityType: 'Admission', entityId: admissionId });
    return mapAdmission(admission);
  }

  static async recordPayment(clinicId: string, admissionId: string, data: any, actorUserId: string) {
    const existing = await prisma.admission.findFirst({ where: { id: admissionId, clinicId } });
    if (!existing) throw { statusCode: 404, code: 'ADMISSION_NOT_FOUND', message: 'Admission not found' };
    if (existing.status !== 'ADMITTED') throw { statusCode: 400, code: 'ADMISSION_CLOSED', message: 'Cannot record payment for a discharged admission' };

    const paidAmount = Number(existing.paidAmount) + Number(data.amount);
    const totalAmount = Number(existing.totalAmount);
    if (totalAmount > 0 && paidAmount > totalAmount) {
      throw { statusCode: 400, code: 'OVERPAYMENT', message: 'Payment exceeds the admission balance' };
    }

    const admission = await prisma.$transaction(async (tx) => {
      await tx.admissionPayment.create({
        data: {
          admissionId,
          amount: data.amount,
          paymentMethod: data.paymentMethod || 'CASH',
          transactionReference: data.transactionReference || null,
          notes: data.notes || null,
        },
      });
      return tx.admission.update({
        where: { id: admissionId },
        data: { paidAmount, pendingAmount: Math.max(0, totalAmount - paidAmount) },
        include: admissionInclude,
      });
    });

    await logAudit({ clinicId, userId: actorUserId, action: 'ADMISSION_PAYMENT_RECORDED', entityType: 'Admission', entityId: admissionId, metadata: { amount: data.amount } });
    return mapAdmission(admission);
  }

  static async discharge(clinicId: string, admissionId: string, data: any, actorUserId: string) {
    const existing = await prisma.admission.findFirst({ where: { id: admissionId, clinicId } });
    if (!existing) throw { statusCode: 404, code: 'ADMISSION_NOT_FOUND', message: 'Admission not found' };
    if (existing.status !== 'ADMITTED') throw { statusCode: 400, code: 'ALREADY_DISCHARGED', message: 'Admission is already discharged' };

    const totalAmount = data.totalAmount !== undefined ? Number(data.totalAmount) : Number(existing.totalAmount);
    const paidAmount = Number(existing.paidAmount);
    if (paidAmount > totalAmount) throw { statusCode: 400, code: 'TOTAL_BELOW_PAID', message: 'Total amount cannot be lower than payments already received' };

    const admission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: 'DISCHARGED',
        dischargedAt: new Date(),
        totalAmount,
        pendingAmount: Math.max(0, totalAmount - paidAmount),
        dischargeSummary: data.dischargeSummary,
      },
      include: admissionInclude,
    });
    await logAudit({ clinicId, userId: actorUserId, action: 'PATIENT_DISCHARGED', entityType: 'Admission', entityId: admissionId });
    return mapAdmission(admission);
  }
}
