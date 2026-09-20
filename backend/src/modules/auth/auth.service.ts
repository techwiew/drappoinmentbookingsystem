import { prisma } from '../../lib/prisma.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { logAudit } from '../../middlewares/audit.js';
import { createHash, randomBytes, randomInt } from 'crypto';
import { sendEmail } from '../../services/email.service.js';

const RESET_OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESET_OTP_MAX_ATTEMPTS = 5;
const hashResetSecret = (value: string) => createHash('sha256').update(value).digest('hex');

export class AuthService {
  static async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.status !== 'ACTIVE') {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'No active user exists with this email address.' };
    }

    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hashResetSecret(otp),
        passwordResetExpiresAt: new Date(Date.now() + RESET_OTP_LIFETIME_MS),
        passwordResetAttempts: 0,
      } as any,
    });
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Your MediNovel password reset code',
        text: `Your MediNovel password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;color:#17201f;max-width:560px;margin:auto"><h1 style="color:#00685f">Reset your MediNovel password</h1><p>Use this verification code to reset your password:</p><p style="margin:24px 0;padding:16px;background:#e8f6f3;border-radius:8px;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center;color:#005049">${otp}</p><p>This code expires in <b>10 minutes</b>. If you did not request a password reset, you can safely ignore this email.</p></div>`,
      });
    } catch (error) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetTokenHash: null, passwordResetExpiresAt: null, passwordResetAttempts: 0 } as any,
      });
      console.error('[password-reset] OTP email delivery failed', error);
      throw { statusCode: 503, code: 'EMAIL_UNAVAILABLE', message: 'We could not send the verification email. Please try again shortly.' };
    }
    return { email: normalizedEmail, expiresInMinutes: 10 };
  }

  static async verifyPasswordResetOtp(email: string, otp: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      throw { statusCode: 400, code: 'OTP_EXPIRED', message: 'This verification code is invalid or has expired. Request a new code.' };
    }
    const passwordResetAttempts = (user as typeof user & { passwordResetAttempts: number }).passwordResetAttempts || 0;
    if (passwordResetAttempts >= RESET_OTP_MAX_ATTEMPTS) {
      throw { statusCode: 429, code: 'OTP_ATTEMPTS_EXCEEDED', message: 'Too many incorrect codes. Request a new code.' };
    }
    if (hashResetSecret(otp) !== user.passwordResetTokenHash) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordResetAttempts: { increment: 1 } } as any });
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'The verification code is incorrect.' };
    }
    const resetToken = randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: hashResetSecret(resetToken), passwordResetExpiresAt: new Date(Date.now() + RESET_OTP_LIFETIME_MS), passwordResetAttempts: 0 } as any,
    });
    return { resetToken, expiresInMinutes: 10 };
  }

  static async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashResetSecret(token);
    const user = await prisma.user.findFirst({
      where: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
    });
    if (!user) {
      throw { statusCode: 400, code: 'INVALID_RESET_TOKEN', message: 'This password reset link is invalid or has expired.' };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(newPassword),
        refreshTokenHash: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetAttempts: 0,
      } as any,
    });
    await logAudit({ userId: user.id, action: 'PASSWORD_RESET', entityType: 'User', entityId: user.id });
  }

  static async login(email: string, pass: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        clinicUsers: {
          include: {
            clinic: true,
          },
        },
        doctor: true,
        receptionist: true,
      },
    });

    if (!user) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    if (user.status !== 'ACTIVE') {
      throw { statusCode: 403, code: 'ACCOUNT_INACTIVE', message: 'Your account is inactive or suspended' };
    }

    const isMatch = await comparePassword(pass, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    const clinicUser = user.clinicUsers[0];
    const clinic = clinicUser?.clinic;
    if (user.role !== 'SUPER_ADMIN' && (!clinic || clinic.status === 'SUSPENDED')) {
      throw { statusCode: 403, code: 'CLINIC_SUSPENDED', message: 'This hospital is suspended. Please contact support.' };
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: clinic?.id,
      doctorId: user.doctor?.id,
      receptionistId: user.receptionist?.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token hash
    const refreshHash = await hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: refreshHash,
        lastLoginAt: new Date(),
      },
    });

    await logAudit({
      clinicId: clinic?.id,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isOwner: clinicUser?.isOwner ?? false,
        status: user.status,
        name: user.doctor?.name || user.receptionist?.name || (user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.email),
        clinic: clinic
          ? {
              id: clinic.id,
              name: clinic.name,
              slug: clinic.slug,
              logo: clinic.logo,
              tokenPrefix: clinic.tokenPrefix,
            }
          : null,
        doctor: user.doctor
          ? {
              id: user.doctor.id,
              name: user.doctor.name,
              specialization: user.doctor.specialization,
              consultationFee: user.doctor.consultationFee,
            }
          : null,
        receptionist: user.receptionist
          ? {
              id: user.receptionist.id,
              name: user.receptionist.name,
            }
          : null,
      },
    };
  }

  static async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          clinicUsers: {
            include: { clinic: true },
          },
          doctor: true,
          receptionist: true,
        },
      });

      if (!user || user.status !== 'ACTIVE' || !user.refreshTokenHash) {
        throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Invalid refresh token' };
      }

      const isMatch = await comparePassword(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Invalid refresh token' };
      }

      const clinicUser = user.clinicUsers.find((membership) => membership.clinicId === payload.clinicId);
      if (user.role !== 'SUPER_ADMIN' && (!clinicUser?.clinic || clinicUser.clinic.status === 'SUSPENDED')) {
        throw { statusCode: 403, code: 'CLINIC_SUSPENDED', message: 'This hospital is suspended. Please contact support.' };
      }
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        clinicId: clinicUser?.clinicId,
        doctorId: user.doctor?.id,
        receptionistId: user.receptionist?.id,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);
      const newRefreshHash = await hashPassword(newRefreshToken);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: newRefreshHash },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e: any) {
      if (e?.code === 'CLINIC_SUSPENDED') throw e;
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Session expired, please login again' };
    }
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return true;
  }

  static async getMe(userId: string, clinicId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clinicUsers: {
          include: {
            clinic: {
              include: {
                subscription: {
                  include: {
                    plan: true,
                  },
                },
              },
            },
          },
        },
        doctor: true,
        receptionist: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const clinicUser = user.clinicUsers.find((membership) => membership.clinicId === clinicId);
    const clinic = clinicUser?.clinic;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isOwner: clinicUser?.isOwner ?? false,
      status: user.status,
      name: user.doctor?.name || user.receptionist?.name || (user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.email),
      clinic: clinic
        ? {
            id: clinic.id,
            name: clinic.name,
            slug: clinic.slug,
            logo: clinic.logo,
            address: clinic.address,
            phone: clinic.phone,
            email: clinic.email,
            city: clinic.city,
            state: clinic.state,
            pincode: clinic.pincode,
            tokenPrefix: clinic.tokenPrefix,
            subscription: clinic.subscription
              ? {
                  planName: clinic.subscription.plan.name,
                  status: clinic.subscription.status,
                  endDate: clinic.subscription.endDate,
                }
              : null,
          }
        : null,
      doctor: user.doctor
        ? {
            id: user.doctor.id,
            name: user.doctor.name,
            specialization: user.doctor.specialization,
            qualification: user.doctor.qualification,
            registrationNumber: user.doctor.registrationNumber,
            consultationFee: user.doctor.consultationFee,
            workingDays: JSON.parse(user.doctor.workingDays || '[]'),
            workingHours: JSON.parse(user.doctor.workingHours || '{}'),
          }
        : null,
      receptionist: user.receptionist
        ? {
            id: user.receptionist.id,
            name: user.receptionist.name,
            mobile: user.receptionist.mobile,
          }
        : null,
    };
  }

  static async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const isMatch = await comparePassword(currentPass, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: 'Current password is incorrect' };
    }

    const newHash = await hashPassword(newPass);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        refreshTokenHash: null,
      },
    });

    return true;
  }

  static async verifyAndChangePassword(email: string, mobile: string, oldPassword: string, newPassword: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        doctor: true,
        receptionist: true,
      }
    });

    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found with this email' };
    }

    // Verify user has either doctor or receptionist profile with matching mobile
    const isDoctorMatch = user.doctor && user.doctor.mobile === mobile.trim();
    const isReceptionistMatch = user.receptionist && user.receptionist.mobile === mobile.trim();

    if (!isDoctorMatch && !isReceptionistMatch) {
      throw { statusCode: 400, code: 'INVALID_MOBILE', message: 'Mobile number does not match our records for this email' };
    }

    // Verify old password
    const isPasswordMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isPasswordMatch) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: 'Current password is incorrect' };
    }

    // Update password and invalidate refresh tokens
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        refreshTokenHash: null,
      },
    });

    // Log the audit
    await logAudit({ userId: user.id, action: 'PASSWORD_CHANGED_WITH_VERIFICATION', entityType: 'User', entityId: user.id });

    return true;
  }
}
