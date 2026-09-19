import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { config } from '../config/index.js';
import { logEvent } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err?.statusCode || (err?.code === 'P2002' ? 409 : err?.code === 'P2025' ? 404 : 500);
  logEvent(statusCode >= 500 ? 'error' : 'warn', 'http.request.failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path,
    statusCode,
    errorCode: err?.code || 'INTERNAL_SERVER_ERROR',
    message: statusCode < 500 ? err?.message : undefined,
    clinicId: req.tenant?.clinicId,
    userId: req.user?.userId,
    role: req.user?.role,
  });

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }

  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : String(err.meta?.target || 'record');
    return sendError(
      res,
      'DUPLICATE_RECORD',
      `A record with this ${target} already exists`,
      409
    );
  }

  if (err.code === 'P2025') {
    return sendError(res, 'NOT_FOUND', 'Requested record was not found', 404);
  }

  const message =
    config.env === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error';

  return sendError(
    res,
    err.code || 'INTERNAL_SERVER_ERROR',
    message,
    statusCode
  );
};
