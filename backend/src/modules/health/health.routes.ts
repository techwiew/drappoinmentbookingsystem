import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'MediNodes API Server',
      database: 'connected',
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

export default router;
