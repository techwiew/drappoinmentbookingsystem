import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/doctor-dashboard', requireRole('DOCTOR'), ReportsController.getDoctorDashboard);
router.get('/receptionist-dashboard', requireRole('RECEPTIONIST'), ReportsController.getReceptionistDashboard);

export default router;
