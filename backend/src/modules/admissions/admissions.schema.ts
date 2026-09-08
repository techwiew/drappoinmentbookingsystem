import { z } from 'zod';

const paymentMethod = z.enum(['CASH', 'UPI', 'CARD', 'OTHER']).default('CASH');

export const listAdmissionsSchema = z.object({
  query: z.object({
    status: z.enum(['ADMITTED', 'DISCHARGED', 'ALL']).optional(),
    patientId: z.string().optional(),
  }),
});

export const admitPatientSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    attendingDoctorId: z.string().optional().or(z.literal('')),
    roomNumber: z.string().optional().or(z.literal('')),
    bedNumber: z.string().optional().or(z.literal('')),
    reason: z.string().min(2, 'Admission reason is required'),
    diagnosis: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    totalAmount: z.number().min(0).default(0),
  }),
});

export const updateAdmissionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    attendingDoctorId: z.string().optional().or(z.literal('')),
    roomNumber: z.string().optional().or(z.literal('')),
    bedNumber: z.string().optional().or(z.literal('')),
    diagnosis: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
  }),
});

export const admissionPaymentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    amount: z.number().positive('Payment amount must be greater than zero'),
    paymentMethod,
    transactionReference: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
  }),
});

export const dischargeAdmissionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    totalAmount: z.number().min(0).optional(),
    dischargeSummary: z.string().min(2, 'Discharge summary is required'),
  }),
});
