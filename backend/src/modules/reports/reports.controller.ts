import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ReportsController {
  static async getDoctorDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = (req.query.doctorId as string) || req.tenant?.doctorId;
      const data = await ReportsService.getDoctorDashboard(
        req.tenant!.clinicId,
        doctorId
      );
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getReceptionistDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getReceptionistDashboard(req.tenant!.clinicId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
