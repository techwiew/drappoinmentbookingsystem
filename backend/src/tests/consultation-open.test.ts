import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({ prisma: {
  patient: { findFirst: vi.fn() }, appointment: { findFirst: vi.fn(), update: vi.fn() },
  consultation: { findFirst: vi.fn() }, $transaction: vi.fn(),
} }));
vi.mock('../middlewares/audit.js', () => ({ logAudit: vi.fn() }));

import { prisma } from '../lib/prisma.js';
import { ConsultationService } from '../modules/consultations/consultations.service.js';

describe('open consultation from patient record', () => {
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
  it('reuses a ready appointment on the clinic date without creating another visit', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-19T20:00:00Z'));
    vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: 'patient', patientDoctors: [] } as any);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({ id: 'appointment', doctorId: 'doctor', status: 'READY_FOR_DOCTOR' } as any);
    vi.mocked(prisma.consultation.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.appointment.update).mockResolvedValue({ id: 'appointment', doctorId: 'doctor', status: 'IN_CONSULTATION' } as any);
    const result = await ConsultationService.openConsultationForPatient('clinic', { patientId: 'patient' }, { userId: 'user', doctorId: 'doctor' });
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      clinicId: 'clinic', doctorId: 'doctor',
      appointmentDate: { gte: new Date('2026-09-20T00:00:00Z'), lt: new Date('2026-09-21T00:00:00Z') },
      status: { in: expect.arrayContaining(['READY_FOR_DOCTOR']) },
    }) }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.appointmentId).toBe('appointment');
  });
});
