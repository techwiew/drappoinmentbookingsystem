import { z } from 'zod';
import { isValidAppointmentTime } from '../../utils/time.js';

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    doctorId: z.string().min(1, 'Doctor ID is required'),
    appointmentDate: z.string().min(1, 'Appointment date is required'),
    appointmentTime: z
      .string()
      .refine(isValidAppointmentTime, 'Appointment time must be a valid time')
      .optional()
      .or(z.literal('')),
    appointmentType: z.enum(['NEW_PATIENT', 'FOLLOW_UP', 'WALK_IN', 'EMERGENCY']).default('NEW_PATIENT'),
    consultationFee: z.number().optional(),
    notes: z.string().optional(),
    directCheckIn: z.boolean().optional().default(false),
  }),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    appointmentDate: z.string().optional(),
    appointmentTime: z
      .string()
      .refine(isValidAppointmentTime, 'Appointment time must be a valid time')
      .optional(),
    appointmentType: z.enum(['NEW_PATIENT', 'FOLLOW_UP', 'WALK_IN', 'EMERGENCY']).optional(),
    status: z.enum([
      'PENDING_CONFIRMATION',
      'BOOKED',
      'CHECKED_IN',
      'WAITING',
      'IN_CONSULTATION',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'SKIPPED',
    ]).optional(),
    consultationFee: z.number().optional(),
    notes: z.string().optional(),
    doctorId: z.string().optional(),
  }),
});
