import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, sendEmailMock } = vi.hoisted(() => ({
  prismaMock: { user: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() } },
  sendEmailMock: vi.fn(),
}));
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../services/email.service.js', () => ({ sendEmail: sendEmailMock }));
vi.mock('../middlewares/audit.js', () => ({ logAudit: vi.fn() }));

import { AuthService } from '../modules/auth/auth.service.js';

describe('email OTP password reset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a visible error instead of sending an OTP for an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(AuthService.requestPasswordReset('missing@example.com')).rejects.toMatchObject({ code: 'USER_NOT_FOUND', statusCode: 404 });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('stores a hash and sends a ten-minute OTP email for an active user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'ACTIVE' });
    prismaMock.user.update.mockResolvedValue({});
    sendEmailMock.mockResolvedValue({});
    const result = await AuthService.requestPasswordReset('DOCTOR@EXAMPLE.COM');
    expect(result).toMatchObject({ email: 'doctor@example.com', expiresInMinutes: 10 });
    expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ passwordResetAttempts: 0 }) }));
    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'doctor@example.com', subject: 'Your MediNovel password reset code' }));
    expect(JSON.stringify(sendEmailMock.mock.calls[0][0])).not.toContain('passwordResetTokenHash');
  });
});
