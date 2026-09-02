import { z } from 'zod';

const mobileSchema = z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits');

export const createReceptionistSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    mobile: mobileSchema,
  }),
});

export const updateReceptionistSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().optional(),
    mobile: mobileSchema.optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});
