import { Router } from 'express';
import { DoctorController } from './doctors.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import { createDoctorSchema, updateDoctorSchema } from './doctors.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

// Any clinic staff can view doctors (needed for booking/assignment)
router.get('/', DoctorController.listDoctors);

// Only DOCTOR with clinic admin rights or doctor role can register new doctor
router.post(
  '/',
  requireRole('DOCTOR'),
  validateRequest(createDoctorSchema),
  DoctorController.createDoctor
);

router.patch(
  '/:id',
  requireRole('DOCTOR'),
  validateRequest(updateDoctorSchema),
  DoctorController.updateDoctor
);

export default router;
