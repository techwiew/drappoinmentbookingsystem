import { z } from 'zod';

export const recordPaymentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    appointmentId: z.string().optional().or(z.literal('')),
    doctorId: z.string().optional().or(z.literal('')),
    consultationFee: z.number().min(0).default(0),
    additionalFee: z.number().min(0).default(0),
    discount: z.number().min(0).default(0),
    paidAmount: z.number().min(0),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']).default('CASH'),
    transactionReference: z.string().optional().or(z.literal('')),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    paidAmount: z.number().min(0).optional(),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']).optional(),
    paymentStatus: z.enum(['PAID', 'PENDING', 'PARTIALLY_PAID']).optional(),
    transactionReference: z.string().optional(),
    discount: z.number().optional(),
    additionalFee: z.number().optional(),
  }),
});
