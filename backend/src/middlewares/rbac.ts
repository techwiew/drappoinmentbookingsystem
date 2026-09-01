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
