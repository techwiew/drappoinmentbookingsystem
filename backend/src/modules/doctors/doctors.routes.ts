import { Router } from 'express';
import { DoctorController } from './doctors.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireClinicOwner, requireOwnerOrSelfDoctor } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import { createDoctorSchema, updateDoctorSchema } from './doctors.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

// Any clinic staff can view doctors (needed for booking/assignment)
router.get('/', DoctorController.listDoctors);

router.post(
  '/',
  requireClinicOwner,
  validateRequest(createDoctorSchema),
  DoctorController.createDoctor
);

router.patch(
  '/:id',
  requireOwnerOrSelfDoctor,
  validateRequest(updateDoctorSchema),
  DoctorController.updateDoctor
);

router.post('/:id/transfer-and-deactivate', requireClinicOwner, DoctorController.transferAndDeactivate);

router.delete(
  '/:id',
  requireClinicOwner,
  DoctorController.deleteDoctor
);

export default router;
