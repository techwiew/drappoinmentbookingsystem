import { prisma } from '../../lib/prisma.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { logAudit } from '../../middlewares/audit.js';
import { createHash, randomBytes } from 'crypto';

export class AuthService {
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.status !== 'ACTIVE') return { resetUrl: null };

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
    return {
      resetUrl: process.env.NODE_ENV === 'production'
        ? null
        : `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`,
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
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
      },
    });
    await logAudit({ clinicId: null, userId: user.id, action: 'PASSWORD_RESET', entityType: 'User', entityId: user.id });
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

      const clinicUser = user.clinicUsers[0];
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

  static async getMe(userId: string) {
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

    const clinicUser = user.clinicUsers[0];
    const clinic = clinicUser?.clinic;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
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
}
