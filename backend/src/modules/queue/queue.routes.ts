import { Router } from 'express';
import { QueueController } from './queue.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', QueueController.getQueue);
router.post('/check-in', QueueController.checkIn);
router.post('/:id/start', QueueController.startConsultation);
router.post('/:id/complete', QueueController.completeConsultation);
router.post('/:id/skip', QueueController.skipToken);
router.post('/:id/no-show', QueueController.markNoShow);

export default router;
