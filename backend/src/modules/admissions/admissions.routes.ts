import { Router } from 'express';
import { AdmissionController } from './admissions.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import {
  admissionPaymentSchema,
  admitPatientSchema,
  dischargeAdmissionSchema,
  listAdmissionsSchema,
  updateAdmissionSchema,
} from './admissions.schema.js';

const router = Router();
router.use(authenticate, requireTenant, requireRole('DOCTOR', 'RECEPTIONIST'));

router.get('/', validateRequest(listAdmissionsSchema), AdmissionController.list);
router.post('/', validateRequest(admitPatientSchema), AdmissionController.admit);
router.patch('/:id', validateRequest(updateAdmissionSchema), AdmissionController.update);
router.post('/:id/payments', validateRequest(admissionPaymentSchema), AdmissionController.payment);
router.post('/:id/discharge', validateRequest(dischargeAdmissionSchema), AdmissionController.discharge);

export default router;
