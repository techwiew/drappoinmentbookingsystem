import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logRequestEvent } from '../../utils/logger.js';

export class ReportsController {
  static async getDoctorDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.tenant!.doctorId;
      if (!doctorId) throw { statusCode: 403, code: 'DOCTOR_REQUIRED', message: 'Doctor profile required' };
      const data = await ReportsService.getDoctorDashboard(
        req.tenant!.clinicId,
        doctorId
      );
      logRequestEvent(req, 'reports.doctor_dashboard.viewed', { doctorId, appointmentCount: data.kpis.totalToday, ipdTrendDays: data.ipdRevenueTrends.length });
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
