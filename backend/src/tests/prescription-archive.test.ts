import { describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  prescription: { findFirst: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../middlewares/audit.js', () => ({ logAudit: vi.fn() }));

import { PrescriptionService } from '../modules/prescriptions/prescriptions.service.js';

describe('prescription archive edit permissions', () => {
  it('requires a prescription belonging to the clinic and assigned doctor', async () => {
    prismaMock.prescription.findFirst.mockResolvedValue(null);
    await expect(PrescriptionService.updatePrescription('clinic-a', 'rx-1', 'doctor-a', 'user-a', [])).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(prismaMock.prescription.findFirst).toHaveBeenCalledWith({ where: { id: 'rx-1', clinicId: 'clinic-a', doctorId: 'doctor-a' } });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
