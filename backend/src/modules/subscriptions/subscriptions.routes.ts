import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { requireTenant } from '../../middlewares/tenant.js';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { clinicId: req.tenant!.clinicId },
      include: { plan: true },
    });

    return sendSuccess(res, {
      subscription: subscription
        ? {
            id: subscription.id,
            planName: subscription.plan.name,
            planCode: subscription.plan.code,
            price: Number(subscription.plan.price),
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            billingCycle: subscription.billingCycle,
            maxDoctors: subscription.plan.maxDoctors,
            maxReceptionists: subscription.plan.maxReceptionists,
            features: JSON.parse(subscription.plan.features || '[]'),
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
