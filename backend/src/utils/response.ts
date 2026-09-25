import { Response } from 'express';

const sensitiveField = /^(password|passwordHash|refreshTokenHash|passwordResetTokenHash)$/i;

const sanitizeResponse = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeResponse);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !sensitiveField.test(key))
      .map(([key, entry]) => [key, sanitizeResponse(entry)])
  );
};

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: PaginationMeta
) => {
  return res.status(statusCode).json({
    success: true,
    data: sanitizeResponse(data),
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  });
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: any
) => {
  res.locals.errorCode = code;
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details: sanitizeResponse(details) } : {}),
    },
  });
};
