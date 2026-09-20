import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, auditMock } = vi.hoisted(() => ({
  prismaMock: { $transaction: vi.fn() },
  auditMock: vi.fn(),
}));
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../middlewares/audit.js', () => ({ logAudit: auditMock }));

import { DoctorService } from '../modules/doctors/doctors.service.js';

describe('doctor transfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves only this clinic\'s active work to its owner and preserves historical records', async () => {
    const appointmentDate = new Date('2026-09-21T00:00:00.000Z');
    const tx = {
      doctor: { findFirst: vi.fn().mockResolvedValue({ id: 'source', clinicId: 'clinic-a', userId: 'source-user' }), update: vi.fn() },
      clinicUser: { findFirst: vi.fn().mockResolvedValue({ user: { doctor: { id: 'owner', clinicId: 'clinic-a', status: 'ACTIVE' } } }) },
      appointment: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([{ id: 'appointment', appointmentDate, tokenNumber: 1 }]),
        findFirst: vi.fn().mockResolvedValue({ tokenNumber: 4 }),
        update: vi.fn(),
      },
      consultation: { count: vi.fn().mockResolvedValue(0) },
      patientDoctor: {
        findMany: vi.fn().mockResolvedValue([{ patientId: 'patient' }]),
        upsert: vi.fn(), updateMany: vi.fn(),
      },
      admission: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: vi.fn() },
    };
    prismaMock.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

    const result = await DoctorService.transferAndDeactivate('clinic-a', 'source', 'owner-user');

    expect(result).toMatchObject({ destinationDoctorId: 'owner', patients: 1, appointments: 1, admissions: 1 });
    expect(tx.doctor.findFirst).toHaveBeenCalledWith({ where: { id: 'source', clinicId: 'clinic-a' } });
    expect(tx.patientDoctor.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ clinicId: 'clinic-a', doctorId: 'owner', patientId: 'patient' }),
    }));
    expect(tx.appointment.update).toHaveBeenCalledWith({ where: { id: 'appointment' }, data: { doctorId: 'owner', tokenNumber: 5 } });
    expect(tx.admission.updateMany).toHaveBeenCalledWith({ where: { clinicId: 'clinic-a', attendingDoctorId: 'source', status: 'ADMITTED' }, data: { attendingDoctorId: 'owner' } });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'source-user' }, data: { status: 'INACTIVE', refreshTokenHash: null } });
    expect(auditMock).toHaveBeenCalledOnce();
  });

  it('protects the owner and never writes or audits that transfer', async () => {
    const tx = {
      doctor: { findFirst: vi.fn().mockResolvedValue({ id: 'owner', clinicId: 'clinic-a' }) },
      clinicUser: { findFirst: vi.fn().mockResolvedValue({ user: { doctor: { id: 'owner', clinicId: 'clinic-a', status: 'ACTIVE' } } }) },
      appointment: { count: vi.fn(), update: vi.fn() },
    };
    prismaMock.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
    await expect(DoctorService.transferAndDeactivate('clinic-a', 'owner', 'owner-user')).rejects.toMatchObject({ code: 'OWNER_PROTECTED' });
    expect(tx.appointment.update).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });
});
