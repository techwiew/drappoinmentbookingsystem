import { z } from 'zod';

export const updateClinicProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Clinic name is required').max(150),
    address: z.string().trim().min(5, 'Clinic address is required').max(500),
    phone: z.string().regex(/^\d{1,12}$/, 'Phone number must contain at most 12 digits'),
    email: z.string().trim().email('Enter a valid email address').max(254),
    city: z.string().trim().min(2, 'City is required').max(100),
    state: z.string().trim().min(2, 'State is required').max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must contain exactly 6 digits'),
    tokenPrefix: z.string().regex(/^[A-Z0-9]{1,5}$/, 'Token prefix must contain 1-5 uppercase letters or digits'),
    logo: z.string().url('Logo must be a valid URL').optional().or(z.literal('')),
  }),
});
