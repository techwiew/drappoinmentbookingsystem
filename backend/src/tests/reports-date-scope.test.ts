import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  appointment: { findMany: vi.fn() },
  payment: { findMany: vi.fn() },
  paymentReceipt: { findMany: vi.fn() },
  admissionPayment: { findMany: vi.fn() },
  consultation: { findMany: vi.fn() },
}));
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));

import { ReportsService } from '../modules/reports/reports.service.js';

describe('financial report date and tenant scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.appointment.findMany.mockResolvedValue([]);
    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.consultation.findMany.mockResolvedValue([]);
    prismaMock.paymentReceipt.findMany.mockResolvedValueOnce([{ amount: '125.25' }, { amount: '20.50' }]).mockResolvedValueOnce([]);
    prismaMock.admissionPayment.findMany.mockResolvedValueOnce([{ amount: '300.75' }]).mockResolvedValueOnce([]);
  });

  it('uses the selected clinic day for OPD and IPD receipts without losing paise', async () => {
    const report = await ReportsService.getDoctorDashboard('clinic-a', 'doctor-a', '2026-09-20');
    expect(report.kpis.todayCollection).toBe(145.75);
    expect(report.kpis.todayIpdCollection).toBe(300.75);
    const receiptWhere = prismaMock.paymentReceipt.findMany.mock.calls[0][0].where;
    const admissionWhere = prismaMock.admissionPayment.findMany.mock.calls[0][0].where;
    expect(receiptWhere).toMatchObject({ clinicId: 'clinic-a', doctorId: 'doctor-a' });
    expect(admissionWhere.admission).toEqual({ clinicId: 'clinic-a' });
    expect(receiptWhere.createdAt.gte.toISOString()).toBe('2026-09-19T18:30:00.000Z');
    expect(receiptWhere.createdAt.lt.toISOString()).toBe('2026-09-20T18:30:00.000Z');
    expect(admissionWhere.createdAt).toEqual(receiptWhere.createdAt);
  });
});
