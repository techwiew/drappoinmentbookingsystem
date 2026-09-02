import { z } from 'zod';

const mobileSchema = z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits');

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Doctor name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    mobile: mobileSchema,
    specialization: z.string().min(2, 'Specialization is required'),
    qualification: z.string().min(2, 'Qualification is required'),
    registrationNumber: z.string().min(2, 'Medical registration number is required'),
    consultationFee: z.number().min(0, 'Consultation fee cannot be negative'),
    workingDays: z.array(z.string()).default(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
    workingHours: z
      .object({
        start: z.string().default('09:00'),
        end: z.string().default('17:00'),
      })
      .default({ start: '09:00', end: '17:00' }),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().optional(),
    mobile: mobileSchema.optional(),
    specialization: z.string().optional(),
    qualification: z.string().optional(),
    registrationNumber: z.string().optional(),
    consultationFee: z.number().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    workingDays: z.array(z.string()).optional(),
    workingHours: z.object({ start: z.string(), end: z.string() }).optional(),
  }),
});
