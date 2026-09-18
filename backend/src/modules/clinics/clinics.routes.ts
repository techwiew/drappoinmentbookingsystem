import { Router } from 'express';
import { ClinicController } from './clinics.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import { updateClinicProfileSchema } from './clinics.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/profile', ClinicController.getProfile);
router.patch('/profile', requireRole('DOCTOR'), validateRequest(updateClinicProfileSchema), ClinicController.updateProfile);

export default router;
