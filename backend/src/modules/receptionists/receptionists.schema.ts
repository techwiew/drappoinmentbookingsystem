import { z } from 'zod';

const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian mobile number');

export const createReceptionistSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is required').max(100).regex(/^[\p{L}][\p{L} .'-]*$/u, 'Name contains invalid characters'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    mobile: mobileSchema,
  }),
});

export const updateReceptionistSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().optional(),
    email: z.string().trim().email('Enter a valid email address').optional(),
    mobile: mobileSchema.optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});
