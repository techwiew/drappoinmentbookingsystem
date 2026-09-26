import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../lib/prisma.js';
import { RoleType } from '../constants/index.js';
import { getTokenFromCookie } from '../utils/cookie.js';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from cookie first, then from Authorization header (for backward compatibility)
    let token = getTokenFromCookie(req);

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return sendError(res, 'UNAUTHORIZED', 'Access token is required', 401);
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return sendError(res, 'UNAUTHORIZED', 'Access token is required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
      return sendError(res, 'UNAUTHORIZED', 'User not found or session expired', 401);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, 'FORBIDDEN', 'User account is deactivated or suspended', 403);
    }

    const clinicUser = user.clinicUsers.find((membership) => membership.clinicId === payload.clinicId);
    if (user.role !== 'SUPER_ADMIN' && !clinicUser) {
      return sendError(res, 'FORBIDDEN', 'Hospital membership is no longer valid', 403);
    }
    if (user.role !== 'SUPER_ADMIN' && (!clinicUser?.clinic || clinicUser.clinic.status === 'SUSPENDED')) {
      return sendError(res, 'CLINIC_SUSPENDED', 'This hospital is suspended. Please contact support.', 403);
    }
    const clinicId = clinicUser?.clinicId;

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as RoleType,
      clinicId,
      doctorId: user.doctor?.id,
      receptionistId: user.receptionist?.id,
    };

    if (clinicUser && clinicUser.clinic) {
      req.tenant = {
        clinicId: clinicUser.clinicId,
        clinicName: clinicUser.clinic.name,
        role: clinicUser.role as RoleType,
        isOwner: clinicUser.isOwner,
        doctorId: user.doctor?.id,
        receptionistId: user.receptionist?.id,
      };
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return sendError(res, 'INVALID_TOKEN', 'Session expired or token invalid', 401);
    }
    next(error);
  }
};
