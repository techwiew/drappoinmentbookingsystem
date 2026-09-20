import { describe, expect, it, vi } from 'vitest';
vi.mock('../lib/prisma.js', () => ({ prisma: { appointment: { findMany: vi.fn() } } }));
vi.mock('../middlewares/audit.js', () => ({ logAudit: vi.fn() }));
import { prisma } from '../lib/prisma.js';
import { QueueService } from '../modules/queue/queue.service.js';

describe('doctor appointment visibility', () => {
  it('returns every status for the complete dashboard and live queue list', async () => {
    const statuses = ['BOOKED', 'CHECKED_IN', 'WAITING', 'READY_FOR_DOCTOR', 'IN_CONSULTATION', 'COMPLETED', 'PENDING_CONFIRMATION', 'CANCELLED', 'SKIPPED', 'NO_SHOW'];
    vi.mocked(prisma.appointment.findMany).mockResolvedValue(statuses.map((status, index) => ({ id: String(index), status, patient: { fullName: `Patient ${index}` }, doctor: { name: 'Doctor' }, payments: [] })) as any);
    const result = await QueueService.getDoctorQueue('clinic', 'doctor', '2026-09-20', true);
    expect(result.allQueue.map((entry) => entry.status)).toEqual(['READY_FOR_DOCTOR', ...statuses.filter((status) => status !== 'READY_FOR_DOCTOR')]);
    expect(result.waitingList.map((entry) => entry.status)).toEqual(['READY_FOR_DOCTOR', 'BOOKED', 'CHECKED_IN', 'WAITING']);
    expect(result.summary.total).toBe(10);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
      clinicId: 'clinic', doctorId: 'doctor', appointmentDate: { gte: new Date('2026-09-20T00:00:00Z'), lt: new Date('2026-09-21T00:00:00Z') },
    } }));
  });
});
