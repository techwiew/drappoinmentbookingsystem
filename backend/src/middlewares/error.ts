import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { logEvent } from '../utils/logger.js';

const databaseUnavailableCodes = new Set(['P1001', 'P1002', 'P1003', 'P1008', 'P1017', 'P2024']);

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const databaseUnavailable = databaseUnavailableCodes.has(err?.code);
  const statusCode = databaseUnavailable ? 503 : err?.statusCode || (err?.code === 'P2002' ? 409 : err?.code === 'P2025' ? 404 : 500);
  logEvent(statusCode >= 500 ? 'error' : 'warn', 'http.request.failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path,
    statusCode,
    errorCode: err?.code || 'INTERNAL_SERVER_ERROR',
    clinicId: req.tenant?.clinicId,
    userId: req.user?.userId,
    role: req.user?.role,
  });

  if (err?.name === 'UnauthorizedError') {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }

  if (databaseUnavailable) {
    return sendError(res, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again shortly.', 503);
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

  const message = statusCode >= 500
    ? 'Something went wrong. Please try again later.'
    : err?.message || 'Unable to complete this request.';

  return sendError(
    res,
    statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : err?.code || 'REQUEST_FAILED',
    message,
    statusCode
  );
};
