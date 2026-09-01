import { Router } from 'express';
import { ReceptionistController } from './receptionists.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import {
  createReceptionistSchema,
  updateReceptionistSchema,
} from './receptionists.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ReceptionistController.listReceptionists);

router.post(
  '/',
  requireRole('DOCTOR'),
  validateRequest(createReceptionistSchema),
  ReceptionistController.createReceptionist
);

router.patch(
  '/:id',
  requireRole('DOCTOR'),
  validateRequest(updateReceptionistSchema),
  ReceptionistController.updateReceptionist
);

export default router;
