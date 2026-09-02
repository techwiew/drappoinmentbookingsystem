import { Router } from 'express';
import { AppointmentController } from './appointments.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { validateRequest } from '../../middlewares/validate.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from './appointments.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', AppointmentController.listAppointments);
router.get('/:id', AppointmentController.getAppointmentById);
router.post(
  '/',
  validateRequest(createAppointmentSchema),
  AppointmentController.createAppointment
);
router.patch(
  '/:id',
  validateRequest(updateAppointmentSchema),
  AppointmentController.updateAppointment
);
router.patch('/:id/cancel', AppointmentController.cancelAppointment);

export default router;
