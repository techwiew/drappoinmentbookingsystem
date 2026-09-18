import { Router } from 'express';
import { QueueController } from './queue.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { requireRole } from '../../middlewares/rbac.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', QueueController.getQueue);
router.post('/check-in', requireRole('RECEPTIONIST'), QueueController.checkIn);
router.post('/:id/send', requireRole('RECEPTIONIST'), QueueController.sendToDoctor);
router.post('/:id/cancel', requireRole('RECEPTIONIST'), QueueController.cancel);
router.post('/:id/start', requireRole('DOCTOR'), QueueController.startConsultation);
router.post('/:id/complete', requireRole('DOCTOR'), QueueController.completeConsultation);
router.post('/:id/skip', requireRole('DOCTOR'), QueueController.skipToken);
router.post('/:id/no-show', requireRole('DOCTOR'), QueueController.markNoShow);

export default router;
