import { Router } from 'express';
import { ConsultationController } from './consultations.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import {
  createConsultationSchema,
  updateConsultationSchema,
} from './consultations.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/:id', ConsultationController.getById);
router.get('/appointment/:appointmentId', ConsultationController.getByAppointment);

// Only DOCTOR can create or update consultations
router.post(
  '/',
  requireRole('DOCTOR'),
  validateRequest(createConsultationSchema),
  ConsultationController.create
);

router.patch(
  '/:id',
  requireRole('DOCTOR'),
  validateRequest(updateConsultationSchema),
  ConsultationController.update
);

export default router;
