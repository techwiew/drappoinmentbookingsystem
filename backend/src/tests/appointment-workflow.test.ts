import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  appointment: { updateMany: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  payment: { findMany: vi.fn() },
  paymentReceipt: { findMany: vi.fn() },
  admissionPayment: { findMany: vi.fn() },
  consultation: { findMany: vi.fn() },
}));
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../middlewares/audit.js', () => ({ logAudit: vi.fn() }));

import { QueueService } from '../modules/queue/queue.service.js';
import { ReportsService } from '../modules/reports/reports.service.js';
import { createPatientSchema } from '../modules/patients/patients.schema.js';

describe('mobile and reception appointment workflow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts up to 12 digits and rejects a thirteenth digit or letters', () => {
    const body = { fullName: 'Patient', gender: 'MALE' as const, age: 30 };
    expect(createPatientSchema.safeParse({ body: { ...body, mobile: '1' } }).success).toBe(true);
    expect(createPatientSchema.safeParse({ body: { ...body, mobile: '123456789012' } }).success).toBe(true);
    expect(createPatientSchema.safeParse({ body: { ...body, mobile: '1234567890123' } }).success).toBe(false);
    expect(createPatientSchema.safeParse({ body: { ...body, mobile: '123abc' } }).success).toBe(false);
  });

  it('only completes a sent appointment in the same clinic, once', async () => {
    prismaMock.appointment.findFirst.mockResolvedValue({ id: 'apt-1' });
    prismaMock.appointment.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    prismaMock.appointment.findUnique.mockResolvedValue({ id: 'apt-1', status: 'COMPLETED' });
    await expect(QueueService.completeAtReception('clinic-a', 'apt-1', 'reception-user')).resolves.toMatchObject({ status: 'COMPLETED' });
    expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({ where: { id: 'apt-1', clinicId: 'clinic-a', status: 'READY_FOR_DOCTOR' }, data: { status: 'COMPLETED' } });
    await expect(QueueService.completeAtReception('clinic-a', 'apt-1', 'reception-user')).rejects.toMatchObject({ code: 'NOT_COMPLETABLE' });
  });

  it('counts waiting and consultation separately for one clinic and doctor', async () => {
    const statusList = ['BOOKED', 'READY_FOR_DOCTOR', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW'];
    prismaMock.appointment.findMany.mockResolvedValue(statusList.map((status) => ({ status, appointmentType: 'FOLLOW_UP', patient: {}, doctor: {}, payments: [], consultation: null })));
    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.paymentReceipt.findMany.mockResolvedValue([]);
    prismaMock.admissionPayment.findMany.mockResolvedValue([]);
    prismaMock.consultation.findMany.mockResolvedValue([]);
    const result = await ReportsService.getDoctorDashboard('clinic-a', 'doctor-a', '2026-09-20');
    expect(result.kpis).toMatchObject({ totalToday: 5, waitingCount: 1, inConsultationCount: 1, completedCount: 1, noShowCount: 1, bookedCount: 1 });
    expect(prismaMock.appointment.findMany.mock.calls[0][0].where).toMatchObject({ clinicId: 'clinic-a', doctorId: 'doctor-a' });
    await ReportsService.getDoctorDashboard('clinic-b', 'doctor-b', '2026-09-20');
    expect(prismaMock.appointment.findMany.mock.calls[1][0].where).toMatchObject({ clinicId: 'clinic-b', doctorId: 'doctor-b' });
  });
});
