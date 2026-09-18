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
  requireRole('DOCTOR'),
  validateRequest(openConsultationSchema),
  ConsultationController.open
);

// Clinical records may only be written by the assigned doctor.
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

router.put(
  '/:id',
  requireRole('DOCTOR'),
  validateRequest(updateConsultationSchema),
  ConsultationController.update
);

export default router;
