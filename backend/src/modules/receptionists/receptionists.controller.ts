import { Request, Response, NextFunction } from 'express';
import { ReceptionistService } from './receptionists.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logRequestEvent } from '../../utils/logger.js';

export class ReceptionistController {
  static async listReceptionists(req: Request, res: Response, next: NextFunction) {
    try {
      const receptionists = await ReceptionistService.listReceptionists(req.tenant!.clinicId);
      return sendSuccess(res, receptionists);
    } catch (error) {
      next(error);
    }
  }

  static async createReceptionist(req: Request, res: Response, next: NextFunction) {
    try {
      const receptionist = await ReceptionistService.createReceptionist(
        req.tenant!.clinicId,
        req.body,
        req.user!.userId
      );
      logRequestEvent(req, 'receptionist.created', { receptionistId: receptionist.id, status: receptionist.status });
      return sendSuccess(res, receptionist, 'Receptionist created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateReceptionist(req: Request, res: Response, next: NextFunction) {
    try {
      const receptionist = await ReceptionistService.updateReceptionist(
        req.tenant!.clinicId,
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, receptionist, 'Receptionist updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteReceptionist(req: Request, res: Response, next: NextFunction) {
    try {
      const receptionist = await ReceptionistService.deleteReceptionist(
        req.tenant!.clinicId,
        req.params.id,
        req.user!.userId
      );
      return sendSuccess(res, receptionist, 'Receptionist deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
