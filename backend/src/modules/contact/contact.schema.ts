import { z } from 'zod';

export const inquirySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    clinicType: z.string().min(1, 'Clinic type is required'),
    city: z.string().min(1, 'City is required'),
  }),
});