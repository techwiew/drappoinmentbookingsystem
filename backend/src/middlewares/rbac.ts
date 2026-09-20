import { Request, Response, NextFunction } from 'express';
import { RoleType } from '../constants/index.js';
import { sendError } from '../utils/response.js';

export const requireRole = (...allowedRoles: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'FORBIDDEN',
        `Access denied. Required role: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};

export const requireClinicOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'DOCTOR' || !req.tenant?.isOwner) {
    return sendError(res, 'OWNER_REQUIRED', 'Only this hospital administrator can manage staff', 403);
  }
  next();
};

export const requireOwnerOrSelfDoctor = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'DOCTOR' || (!req.tenant?.isOwner && req.tenant?.doctorId !== req.params.id)) {
    return sendError(res, 'OWNER_REQUIRED', 'You can edit only your own doctor profile', 403);
  }
  if (!req.tenant?.isOwner && req.body?.status !== undefined) {
    return sendError(res, 'OWNER_REQUIRED', 'Only this hospital administrator can change staff status', 403);
  }
  next();
};
