import { Request, Response, NextFunction } from 'express';
import { SuperAdminService } from './super-admin.service.js';
import { sendSuccess } from '../../utils/response.js';

export class SuperAdminController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await SuperAdminService.getDashboardStats();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async listClinics(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await SuperAdminService.listClinics({ page, limit, search, status });
      return sendSuccess(res, result.clinics, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async createClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await SuperAdminService.createClinic(req.body, req.user!.userId);
      return sendSuccess(res, clinic, 'Clinic created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const clinic = await SuperAdminService.updateClinicStatus(id, status, req.user!.userId);
      return sendSuccess(res, clinic, 'Clinic status updated');
    } catch (error) {
      next(error);
    }
  }

  static async updateClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await SuperAdminService.updateClinic(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, clinic, 'Clinic updated');
    } catch (error) {
      next(error);
    }
  }

  static async listPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await SuperAdminService.listPlans();
      return sendSuccess(res, plans);
    } catch (error) {
      next(error);
    }
  }
}
