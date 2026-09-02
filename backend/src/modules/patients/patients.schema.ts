import { z } from 'zod';

const mobileSchema = z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits');

export const createPatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    mobile: mobileSchema,
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    age: z.number().min(0).max(150).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
    bloodGroup: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    pincode: z.string().optional().or(z.literal('')),
    allergies: z.string().optional().or(z.literal('')),
    existingIllness: z.string().optional().or(z.literal('')),
    medicalConditions: z.string().optional().or(z.literal('')),
    emergencyContactName: z.string().optional().or(z.literal('')),
    emergencyContactRelationship: z.string().optional().or(z.literal('')),
    emergencyContactMobile: mobileSchema.optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    doctorIds: z.array(z.string()).optional(),
  }),
});

export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    mobile: mobileSchema.optional(),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    age: z.number().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    bloodGroup: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    pincode: z.string().optional().or(z.literal('')),
    allergies: z.string().optional().or(z.literal('')),
    existingIllness: z.string().optional().or(z.literal('')),
    medicalConditions: z.string().optional().or(z.literal('')),
    emergencyContactName: z.string().optional().or(z.literal('')),
    emergencyContactRelationship: z.string().optional().or(z.literal('')),
    emergencyContactMobile: mobileSchema.optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
  }),
});

export const assignDoctorSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
});
