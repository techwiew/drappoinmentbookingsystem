import { Router } from 'express';
import { ConsultationController } from './consultations.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import {
  createConsultationSchema,
  openConsultationSchema,
  updateConsultationSchema,
} from './consultations.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ConsultationController.list);
router.get('/appointment/:appointmentId', ConsultationController.getByAppointment);
router.get('/:id', ConsultationController.getById);

router.post(
  '/open',
  requireRole('DOCTOR', 'RECEPTIONIST'),
  validateRequest(openConsultationSchema),
  ConsultationController.open
);

// Both DOCTOR and RECEPTIONIST can create or update consultations
router.post(
  '/',
  requireRole('DOCTOR', 'RECEPTIONIST'),
  validateRequest(createConsultationSchema),
  ConsultationController.create
);

router.patch(
  '/:id',
  requireRole('DOCTOR', 'RECEPTIONIST'),
  validateRequest(updateConsultationSchema),
  ConsultationController.update
);

router.put(
  '/:id',
  requireRole('DOCTOR', 'RECEPTIONIST'),
  validateRequest(updateConsultationSchema),
  ConsultationController.update
);

export default router;
