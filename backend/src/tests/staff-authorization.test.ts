import { describe, expect, it, vi } from 'vitest';
import { requireClinicOwner, requireOwnerOrSelfDoctor } from '../middlewares/rbac.js';

const response = () => {
  const res: any = { locals: {}, status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('hospital staff authorization', () => {
  it('allows only the owner doctor to manage staff', () => {
    for (const role of ['RECEPTIONIST', 'DOCTOR']) {
      const res = response();
      const next = vi.fn();
      requireClinicOwner({ user: { role }, tenant: { isOwner: false } } as any, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
    const res = response();
    const next = vi.fn();
    requireClinicOwner({ user: { role: 'DOCTOR' }, tenant: { isOwner: true } } as any, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('lets a regular doctor edit their own profile but not another doctor or status', () => {
    const base = { user: { role: 'DOCTOR' }, tenant: { isOwner: false, doctorId: 'own' } };
    const selfNext = vi.fn();
    requireOwnerOrSelfDoctor({ ...base, params: { id: 'own' }, body: { name: 'Updated' } } as any, response(), selfNext);
    expect(selfNext).toHaveBeenCalledOnce();
    for (const req of [
      { ...base, params: { id: 'other' }, body: { name: 'Updated' } },
      { ...base, params: { id: 'own' }, body: { status: 'INACTIVE' } },
    ]) {
      const res = response();
      const next = vi.fn();
      requireOwnerOrSelfDoctor(req as any, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });
});
