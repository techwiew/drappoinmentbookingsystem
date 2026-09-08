import { z } from 'zod';

export const createClinicSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Clinic name is required"),
    address: z.string().min(2, "Address is required"),
    phone: z.string().min(5, "Phone number is required"),
    email: z.string().email("Invalid email address"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(4, "Pincode is required"),
    planPrice: z.number().min(0, "Plan price cannot be negative"),
    activeMonths: z.number().int().min(1, "Active months must be at least 1"),
    adminName: z.string().min(2, "Doctor/Admin name is required"),
    adminEmail: z.string().email("Invalid admin email"),
    adminPassword: z.string().min(6, "Password must be at least 6 characters"),
    adminMobile: z.string().min(5, "Mobile number is required"),
    maxDoctors: z.number().int().min(1).default(1),
    maxReceptionists: z.number().int().min(0).default(2),
    specialization: z.string().default("General Medicine"),
    qualification: z.string().default("MBBS"),
    registrationNumber: z.string().default("MCI-REG-001"),
    consultationFee: z.number().default(500),
  }),
});

export const updateClinicStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']),
  }),
});

export const updateClinicSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    tokenPrefix: z.string().optional(),
    planId: z.string().optional(),
    maxDoctors: z.number().int().min(1).optional(),
    maxReceptionists: z.number().int().min(0).optional(),
  }),
});
