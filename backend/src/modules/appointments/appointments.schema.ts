import { z } from 'zod';
import { isValidAppointmentTime } from '../../utils/time.js';

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    doctorId: z.string().min(1, 'Doctor ID is required'),
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must use YYYY-MM-DD'),
    appointmentTime: z
      .string()
      .refine(isValidAppointmentTime, 'Appointment time must be a valid time')
      .optional()
      .or(z.literal('')),
    appointmentType: z.enum(['NEW_PATIENT', 'FOLLOW_UP', 'WALK_IN', 'EMERGENCY']).default('NEW_PATIENT'),
    consultationFee: z.number().optional(),
    notes: z.string().optional(),
    reasonForVisit: z.string().trim().max(2000).optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    appointmentTime: z
      .string()
      .refine(isValidAppointmentTime, 'Appointment time must be a valid time')
      .optional().or(z.literal('')),
    appointmentType: z.enum(['NEW_PATIENT', 'FOLLOW_UP', 'WALK_IN', 'EMERGENCY']).optional(),
    status: z.enum([
      'PENDING_CONFIRMATION',
      'BOOKED',
      'CANCELLED',
    ]).optional(),
    consultationFee: z.number().optional(),
    notes: z.string().optional(),
    reasonForVisit: z.string().trim().max(2000).optional(),
    doctorId: z.string().optional(),
  }),
});
