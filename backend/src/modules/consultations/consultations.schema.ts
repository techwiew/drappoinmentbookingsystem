import { z } from 'zod';

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().default(''),
  frequency: z.string().default('1-0-1'),
  duration: z.string().default('5 days'),
  instructions: z.string().optional(),
});

export const createConsultationSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
    patientId: z.string().min(1, 'Patient ID is required').optional(),
    doctorId: z.string().optional(),
    chiefComplaint: z.string().optional(),
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    doctorNotes: z.string().optional(),
    advice: z.string().optional(),
    testsRecommended: z.string().optional(),
    nextVisitDate: z.string().optional().or(z.literal('')),
    followUpNotes: z.string().optional(),
    status: z.enum(['DRAFT', 'COMPLETED']).default('COMPLETED'),
    medicines: z.array(prescriptionItemSchema).optional().default([]),
  }),
});

export const openConsultationSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    doctorId: z.string().optional(),
  }),
});

export const updateConsultationSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    chiefComplaint: z.string().optional(),
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    doctorNotes: z.string().optional(),
    advice: z.string().optional(),
    testsRecommended: z.string().optional(),
    nextVisitDate: z.string().optional().or(z.literal('')),
    followUpNotes: z.string().optional(),
    status: z.enum(['DRAFT', 'COMPLETED']).optional(),
    medicines: z.array(prescriptionItemSchema).optional(),
  }),
});
