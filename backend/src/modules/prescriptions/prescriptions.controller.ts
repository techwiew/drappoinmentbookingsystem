import { Request, Response, NextFunction } from 'express';
import { PrescriptionService } from './prescriptions.service.js';
import { sendSuccess } from '../../utils/response.js';

export class PrescriptionController {
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const rx = await PrescriptionService.getPrescriptionById(
        req.tenant!.clinicId,
        req.params.id
      );
      return sendSuccess(res, rx);
    } catch (error) {
      next(error);
    }
  }
}
