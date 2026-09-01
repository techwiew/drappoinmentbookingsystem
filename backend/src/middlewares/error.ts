import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { config } from '../config/index.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Structured logging for debugging
  console.error('[API Error]', {
    message: err?.message || err,
    stack: config.env === 'development' ? err?.stack : undefined,
    path: req.path,
    method: req.method,
    clinicId: req.tenant?.clinicId,
    userId: req.user?.userId,
  });

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }

  if (err.code === 'P2002') {
    return sendError(
      res,
      'DUPLICATE_RECORD',
      'A record with matching unique constraints already exists',
      409
    );
  }

  if (err.code === 'P2025') {
    return sendError(res, 'NOT_FOUND', 'Requested record was not found', 404);
  }

  const statusCode = err.statusCode || 500;
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
