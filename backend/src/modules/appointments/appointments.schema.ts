import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    doctorId: z.string().min(1, 'Doctor ID is required'),
    appointmentDate: z.string().min(1, 'Appointment date is required'),
    appointmentTime: z.string().default('10:00 AM'),
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
    appointmentTime: z.string().optional(),
    appointmentType: z.enum(['NEW_PATIENT', 'FOLLOW_UP', 'WALK_IN', 'EMERGENCY']).optional(),
    status: z.enum([
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
