import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from './appointments.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AppointmentController {
  static async getAppointmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentService.getAppointmentById(
        req.tenant!.clinicId,
        req.params.id
      );

      return sendSuccess(res, appointment);
    } catch (error) {
      next(error);
    }
  }

  static async listAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const date = req.query.date as string;
      const doctorId = req.query.doctorId as string;
      const status = req.query.status as string;

      const result = await AppointmentService.listAppointments(req.tenant!.clinicId, {
        page,
        limit,
        date,
        doctorId,
        status,
      });

      return sendSuccess(res, result.appointments, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async createAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentService.createAppointment(
        req.tenant!.clinicId,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, appointment, 'Appointment booked successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await AppointmentService.updateAppointment(
        req.tenant!.clinicId,
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, updated, 'Appointment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async cancelAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AppointmentService.cancelAppointment(
        req.tenant!.clinicId,
        req.params.id,
        req.user!.userId
      );
      return sendSuccess(res, result, 'Appointment cancelled');
    } catch (error) {
      next(error);
    }
  }
}
