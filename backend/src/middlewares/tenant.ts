import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenant || !req.tenant.clinicId) {
    return sendError(
      res,
      'TENANT_REQUIRED',
      'This action requires an active clinic tenant membership',
      403
    );
  }
  next();
};
