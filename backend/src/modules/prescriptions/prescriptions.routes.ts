import { Router } from 'express';
import { PrescriptionController } from './prescriptions.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import { updatePrescriptionSchema } from './prescriptions.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/:id', PrescriptionController.getById);
router.patch('/:id', requireRole('DOCTOR'), validateRequest(updatePrescriptionSchema), PrescriptionController.update);

export default router;
