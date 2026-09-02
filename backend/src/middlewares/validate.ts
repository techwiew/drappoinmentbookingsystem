import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export const validateRequest = (
  schema: AnyZodObject | { body?: AnyZodObject; query?: AnyZodObject; params?: AnyZodObject }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parseAsync' in schema) {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
      } else {
        if (schema.body) req.body = await schema.body.parseAsync(req.body);
        if (schema.query) req.query = await schema.query.parseAsync(req.query);
        if (schema.params) req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid request payload or parameters',
          400,
          errorMessages
        );
      }
      return sendError(res, 'BAD_REQUEST', 'Failed to process request data', 400);
    }
  };
};
