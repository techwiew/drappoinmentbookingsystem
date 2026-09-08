import { Router } from 'express';
import { SuperAdminController } from './super-admin.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import { createClinicSchema, updateClinicSchema, updateClinicStatusSchema } from './super-admin.schema.js';

const router = Router();

// Protect all super admin routes
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/dashboard', SuperAdminController.getDashboard);
router.get('/clinics', SuperAdminController.listClinics);
router.post('/clinics', validateRequest(createClinicSchema), SuperAdminController.createClinic);
router.patch('/clinics/:id', validateRequest(updateClinicSchema), SuperAdminController.updateClinic);
router.patch(
  '/clinics/:id/status',
  validateRequest(updateClinicStatusSchema),
  SuperAdminController.updateStatus
);
router.get('/plans', SuperAdminController.listPlans);

export default router;
