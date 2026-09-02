import { Router } from 'express';
import { PatientController } from './patients.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validate.js';
import {
  createPatientSchema,
  updatePatientSchema,
  assignDoctorSchema,
} from './patients.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', PatientController.listPatients);
router.get('/check-duplicate', PatientController.checkDuplicate);
router.post('/', validateRequest(createPatientSchema), PatientController.createPatient);
router.get('/:id', PatientController.getPatientById);
router.patch('/:id', validateRequest(updatePatientSchema), PatientController.updatePatient);
router.post(
  '/:id/doctors',
  requireRole('DOCTOR'),
  validateRequest(assignDoctorSchema),
  PatientController.assignDoctor
);
router.delete(
  '/:id/doctors/:doctorId',
  requireRole('DOCTOR'),
  PatientController.removeDoctor
);

export default router;
