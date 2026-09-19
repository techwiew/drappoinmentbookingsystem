import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

type LogLevel = 'info' | 'warn' | 'error';
type LogFields = Record<string, string | number | boolean | null | undefined>;

export const logEvent = (level: LogLevel, event: string, fields: LogFields = {}): void => {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
};

export const logRequestEvent = (req: Request, event: string, fields: LogFields = {}): void => {
  logEvent('info', event, {
    requestId: req.requestId,
    clinicId: req.tenant?.clinicId,
    userId: req.user?.userId,
    role: req.user?.role,
    ...fields,
  });
};

/** Log request metadata and outcomes. Never log bodies, query strings, tokens, or response data. */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const suppliedId = req.get('x-request-id');
  req.requestId = suppliedId && /^[a-zA-Z0-9_-]{1,80}$/.test(suppliedId) ? suppliedId : randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const startedAt = process.hrtime.bigint();
  logEvent('info', 'http.request.started', { requestId: req.requestId, method: req.method, path: req.path });

  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logEvent(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'http.request.completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      clinicId: req.tenant?.clinicId,
      userId: req.user?.userId,
      role: req.user?.role,
      errorCode: res.locals.errorCode,
    });
  });
  next();
};
