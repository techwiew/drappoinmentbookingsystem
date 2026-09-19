import { Request, Response, NextFunction } from 'express';
import { ClinicService } from './clinics.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logRequestEvent } from '../../utils/logger.js';

export class ClinicController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ClinicService.getProfile(req.tenant!.clinicId);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await ClinicService.updateProfile(
        req.tenant!.clinicId,
        req.body,
        req.user!.userId
      );
      logRequestEvent(req, 'clinic.profile.updated', { updatedFields: Object.keys(req.body).sort().join(','), clinicId: updated.id });
      return sendSuccess(res, updated, 'Clinic profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
