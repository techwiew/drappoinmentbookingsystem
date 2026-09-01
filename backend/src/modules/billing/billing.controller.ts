import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service.js';
import { sendSuccess } from '../../utils/response.js';

export class BillingController {
  static async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const date = req.query.date as string;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const result = await BillingService.listPayments(req.tenant!.clinicId, {
        page,
        limit,
        date,
        status,
        search,
      });

      return sendSuccess(res, result.payments, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await BillingService.recordPayment(
        req.tenant!.clinicId,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, payment, 'Payment recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await BillingService.updatePayment(
        req.tenant!.clinicId,
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, updated, 'Payment updated');
    } catch (error) {
      next(error);
    }
  }

  static async getReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const receipt = await BillingService.getReceipt(
        req.tenant!.clinicId,
        req.params.id
      );
      return sendSuccess(res, receipt);
    } catch (error) {
      next(error);
    }
  }
}
