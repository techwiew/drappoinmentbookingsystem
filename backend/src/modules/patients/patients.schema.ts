import { z } from 'zod';

const mobileSchema = z.string().regex(/^\d{1,12}$/, 'Mobile number must contain at most 12 digits');
const patientNameSchema = z.string().trim().min(2, 'Full name must contain at least 2 letters').max(100).regex(/^[\p{L}][\p{L} .'-]*$/u, 'Full name can contain letters, spaces, apostrophes, hyphens, and periods only');
const pincodeSchema = z.string().regex(/^\d{6}$/, 'Pincode must contain exactly 6 digits');

export const createPatientSchema = z.object({
  body: z.object({
    fullName: patientNameSchema,
    mobile: mobileSchema,
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().date('Date of birth must use YYYY-MM-DD').optional().or(z.literal('')),
    age: z.number().min(0).max(150).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
    bloodGroup: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    pincode: pincodeSchema.optional().or(z.literal('')),
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
    fullName: patientNameSchema.optional(),
    mobile: mobileSchema.optional(),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    age: z.number().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    bloodGroup: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    pincode: pincodeSchema.optional().or(z.literal('')),
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
