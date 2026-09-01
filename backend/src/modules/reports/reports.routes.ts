import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/doctor-dashboard', ReportsController.getDoctorDashboard);
router.get('/receptionist-dashboard', ReportsController.getReceptionistDashboard);

export default router;
