import { Request, Response, NextFunction } from 'express';
import { ConsultationService } from './consultations.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ConsultationController {
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.getConsultationById(
        req.tenant!.clinicId,
        req.params.id
      );
      return sendSuccess(res, consultation);
    } catch (error) {
      next(error);
    }
  }

  static async getByAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.getConsultationByAppointment(
        req.tenant!.clinicId,
        req.params.appointmentId
      );
      return sendSuccess(res, consultation);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.createConsultation(
        req.tenant!.clinicId,
        req.body,
        req.tenant?.doctorId || '',
        req.user!.userId
      );
      return sendSuccess(res, consultation, 'Consultation recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.updateConsultation(
        req.tenant!.clinicId,
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, consultation, 'Consultation updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
