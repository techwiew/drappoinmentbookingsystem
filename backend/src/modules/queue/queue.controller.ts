import { Request, Response, NextFunction } from 'express';
import { QueueService } from './queue.service.js';
import { sendSuccess } from '../../utils/response.js';

export class QueueController {
  static async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = (req.query.doctorId as string) || req.tenant?.doctorId;
      const date = req.query.date as string;

      const queue = await QueueService.getDoctorQueue(
        req.tenant!.clinicId,
        doctorId,
        date
      );
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
        req.user!.userId
      );
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
        req.user!.userId
      );
      return sendSuccess(res, updated, 'Consultation marked completed');
    } catch (error) {
      next(error);
    }
  }

  static async skipToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await QueueService.skipToken(
        req.tenant!.clinicId,
        id,
        req.user!.userId
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
        req.user!.userId
      );
      return sendSuccess(res, updated, 'Patient marked as No-Show');
    } catch (error) {
      next(error);
    }
  }
}
