import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../lib/prisma.js';
import { RoleType } from '../constants/index.js';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'UNAUTHORIZED', 'Missing or invalid authorization header', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'UNAUTHORIZED', 'Access token is required', 401);
    }

    const payload = verifyAccessToken(token);

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

    const clinicUser = user.clinicUsers[0];
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
  } catch (error: any) {
    return sendError(res, 'INVALID_TOKEN', 'Session expired or token invalid', 401);
  }
};
