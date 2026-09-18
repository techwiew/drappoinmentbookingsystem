import { z } from 'zod';

const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian mobile number');
const nameSchema = z.string().trim().min(2, 'Doctor name must contain at least 2 letters').max(100).regex(/^[\p{L}][\p{L} .'-]*$/u, 'Doctor name can contain letters, spaces, apostrophes, hyphens, and periods only');
const textSchema = (label: string) => z.string().trim().min(2, `${label} is required`).max(100, `${label} must be 100 characters or fewer`);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Working hours must use HH:MM (24-hour) format');

export const createDoctorSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: z.string().trim().email('Enter a valid email address').max(254),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    mobile: mobileSchema,
    specialization: textSchema('Specialization'),
    qualification: textSchema('Qualification'),
    registrationNumber: z.string().trim().min(2, 'Medical registration number is required').max(50),
    consultationFee: z.number().finite('Consultation fee must be a number').min(0, 'Consultation fee cannot be negative').max(1000000, 'Consultation fee is too high'),
    workingDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).min(1, 'Select at least one working day').default(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
    workingHours: z
      .object({
        start: timeSchema.default('09:00'),
        end: timeSchema.default('17:00'),
      })
      .default({ start: '09:00', end: '17:00' }),
  }).superRefine((data, ctx) => {
    if (data.workingHours.start >= data.workingHours.end) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['workingHours', 'end'], message: 'End time must be after start time' });
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: nameSchema.optional(),
    mobile: mobileSchema.optional(),
    specialization: textSchema('Specialization').optional(),
    qualification: textSchema('Qualification').optional(),
    registrationNumber: z.string().trim().min(2, 'Medical registration number is required').max(50).optional(),
    consultationFee: z.number().finite().min(0, 'Consultation fee cannot be negative').max(1000000).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    workingDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).min(1, 'Select at least one working day').optional(),
    workingHours: z.object({ start: timeSchema, end: timeSchema }).optional(),
  }),
});
