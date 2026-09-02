import { Request, Response, NextFunction } from 'express';
import { ConsultationService } from './consultations.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ConsultationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const consultations = await ConsultationService.listConsultations(
        req.tenant!.clinicId,
        {
          appointmentId: req.query.appointmentId as string | undefined,
          patientId: req.query.patientId as string | undefined,
        }
      );

      return sendSuccess(res, consultations);
    } catch (error) {
      next(error);
    }
  }

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

  static async open(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConsultationService.openConsultationForPatient(
        req.tenant!.clinicId,
        req.body,
        {
          userId: req.user!.userId,
          doctorId: req.tenant?.doctorId || null,
        }
      );

      return sendSuccess(res, result, 'Consultation opened successfully', 201);
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
