import { Router } from 'express';
import { ClinicController } from './clinics.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/profile', ClinicController.getProfile);
router.patch('/profile', requireRole('DOCTOR'), ClinicController.updateProfile);

export default router;
