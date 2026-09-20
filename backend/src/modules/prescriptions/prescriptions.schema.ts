import { z } from 'zod';

export const updatePrescriptionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    items: z.array(z.object({
      medicineName: z.string().trim().min(1),
      dosage: z.string().default(''),
      frequency: z.string().default('1-0-1'),
      duration: z.string().default('5 days'),
      foodTiming: z.enum(['BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'NO_PREFERENCE']).default('NO_PREFERENCE'),
      instructions: z.string().optional(),
    })).min(1),
  }),
});
