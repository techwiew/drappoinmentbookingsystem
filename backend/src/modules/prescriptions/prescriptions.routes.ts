import { Router } from 'express';
import { PrescriptionController } from './prescriptions.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/:id', PrescriptionController.getById);

export default router;
