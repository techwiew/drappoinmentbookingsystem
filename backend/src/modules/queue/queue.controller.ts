import { Request, Response, NextFunction } from 'express';
import { QueueService } from './queue.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logRequestEvent } from '../../utils/logger.js';

export class QueueController {
  static async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user!.role === 'DOCTOR'
        ? req.tenant!.doctorId
        : req.query.doctorId as string;
      if (req.user!.role === 'DOCTOR' && !doctorId) {
        throw { statusCode: 403, code: 'DOCTOR_REQUIRED', message: 'Doctor profile required' };
      }
      const date = req.query.date as string;

      const queue = await QueueService.getDoctorQueue(
        req.tenant!.clinicId,
        doctorId,
        date,
        req.user!.role === 'DOCTOR'
      );
      logRequestEvent(req, 'queue.viewed', { date: queue.date, doctorId: doctorId || null, total: queue.summary.total, waiting: queue.summary.waiting, booked: queue.summary.booked });
      return sendSuccess(res, queue);
    } catch (error) {
      next(error);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.body;
      const updated = await QueueService.checkIn(
        req.tenant!.clinicId,
        appointmentId,
        req.user!.userId
      );
      return sendSuccess(res, updated, 'Patient checked in to queue');
    } catch (error) {
      next(error);
    }
  }

  static async startConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await QueueService.startConsultation(
        req.tenant!.clinicId,
        id,
        req.user!.userId,
        req.tenant!.doctorId!
      );
      logRequestEvent(req, 'consultation.started', { appointmentId: updated?.id, doctorId: req.tenant!.doctorId });
      return sendSuccess(res, updated, 'Consultation started');
    } catch (error) {
      next(error);
    }
  }

  static async completeConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await QueueService.completeConsultation(
        req.tenant!.clinicId,
        id,
        req.user!.userId,
        req.tenant!.doctorId!
      );
      return sendSuccess(res, updated, 'Consultation marked completed');
    } catch (error) {
      next(error);
    }
  }

  static async sendToDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await QueueService.sendToDoctor(req.tenant!.clinicId, req.params.id, req.user!.userId);
      logRequestEvent(req, 'appointment.sent_to_doctor', { appointmentId: req.params.id });
      return sendSuccess(res, updated, 'Patient sent to doctor');
    } catch (error) { next(error); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await QueueService.cancel(req.tenant!.clinicId, req.params.id, req.user!.userId);
      return sendSuccess(res, updated, 'Appointment cancelled');
    } catch (error) { next(error); }
  }

  static async skipToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await QueueService.skipToken(
        req.tenant!.clinicId,
        id,
        req.user!.userId,
        req.tenant!.doctorId!
      );
      return sendSuccess(res, updated, 'Token skipped');
    } catch (error) {
      next(error);
    }
  }

  static async markNoShow(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await QueueService.markNoShow(
        req.tenant!.clinicId,
        id,
        req.user!.userId,
        req.tenant!.doctorId!
      );
      return sendSuccess(res, updated, 'Patient marked as No-Show');
    } catch (error) {
      next(error);
    }
  }
}
