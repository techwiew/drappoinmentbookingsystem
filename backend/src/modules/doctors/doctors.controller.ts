import { Request, Response, NextFunction } from 'express';
import { DoctorService } from './doctors.service.js';
import { sendSuccess } from '../../utils/response.js';

export class DoctorController {
  static async listDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const doctors = await DoctorService.listDoctors(req.tenant!.clinicId);
      return sendSuccess(res, doctors);
    } catch (error) {
      next(error);
    }
  }

  static async createDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorService.createDoctor(
        req.tenant!.clinicId,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, doctor, 'Doctor registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorService.updateDoctor(
        req.tenant!.clinicId,
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, doctor, 'Doctor updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
