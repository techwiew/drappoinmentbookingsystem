import { expect, it, vi } from 'vitest';

const { prismaMock, auditMock } = vi.hoisted(() => ({
  prismaMock: { consultation: { findFirst: vi.fn() }, $transaction: vi.fn() },
  auditMock: vi.fn(),
}));
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../middlewares/audit.js', () => ({ logAudit: auditMock }));

import { ConsultationService } from '../modules/consultations/consultations.service.js';

it('moves one existing follow-up when its consultation date changes', async () => {
  const consultation = {
    id: 'consultation', clinicId: 'clinic-a', doctorId: 'doctor-a', patientId: 'patient-a',
    appointmentId: 'original', status: 'DRAFT', nextVisitDate: new Date('2026-10-01T00:00:00.000Z'),
    appointment: { consultationFee: 100 },
    doctor: { id: 'doctor-a', name: 'Dr A', consultationFee: 100 },
    patient: { fullName: 'Patient A', patientNumber: 'A1' },
    prescription: null,
  };
  prismaMock.consultation.findFirst.mockResolvedValue(consultation);
  const tx = {
    consultation: { update: vi.fn().mockResolvedValue({ ...consultation, nextVisitDate: new Date('2026-10-03T00:00:00.000Z') }) },
    appointment: {
      update: vi.fn(), findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([{ id: 'follow-up' }]), count: vi.fn().mockResolvedValue(2), create: vi.fn(),
    },
    payment: { findFirst: vi.fn().mockResolvedValue({ id: 'invoice' }), create: vi.fn() },
  };
  prismaMock.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

  await ConsultationService.updateConsultation('clinic-a', 'consultation', {
    status: 'COMPLETED', nextVisitDate: '2026-10-03',
  }, 'doctor-user', 'doctor-a');

  expect(tx.appointment.update).toHaveBeenCalledWith({
    where: { id: 'follow-up' },
    data: {
      appointmentDate: new Date('2026-10-03T00:00:00.000Z'), appointmentTime: null,
      tokenNumber: 3, status: 'PENDING_CONFIRMATION', notes: null,
    },
  });
  expect(tx.appointment.create).not.toHaveBeenCalled();
});
