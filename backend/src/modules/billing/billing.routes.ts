import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { validateRequest } from '../../middlewares/validate.js';
import { recordPaymentSchema, updatePaymentSchema } from './billing.schema.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', BillingController.listPayments);
router.post('/', validateRequest(recordPaymentSchema), BillingController.recordPayment);
router.patch('/:id', validateRequest(updatePaymentSchema), BillingController.updatePayment);
router.get('/:id/receipt', BillingController.getReceipt);

export default router;
