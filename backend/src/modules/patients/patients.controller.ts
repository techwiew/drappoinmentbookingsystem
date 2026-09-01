import { Request, Response, NextFunction } from 'express';
import { PatientService } from './patients.service.js';
import { sendSuccess } from '../../utils/response.js';

export class PatientController {
  static async listPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const doctorId = req.query.doctorId as string;

      const result = await PatientService.listPatients(req.tenant!.clinicId, {
        page,
        limit,
        search,
        doctorId,
      });

      return sendSuccess(res, result.patients, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async checkDuplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const mobile = req.query.mobile as string;
      const patientNumber = req.query.patientNumber as string;
      const fullName = req.query.fullName as string;

      const result = await PatientService.checkDuplicate(req.tenant!.clinicId, {
        mobile,
        patientNumber,
        fullName,
      });

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.createPatient(
        req.tenant!.clinicId,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, patient, 'Patient registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.getPatientById(
        req.tenant!.clinicId,
        req.params.id
      );
      return sendSuccess(res, patient);
    } catch (error) {
      next(error);
    }
  }

  static async updatePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.updatePatient(
        req.tenant!.clinicId,
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, patient, 'Patient record updated');
    } catch (error) {
      next(error);
    }
  }

  static async assignDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PatientService.assignDoctor(
        req.tenant!.clinicId,
        req.params.id,
        req.body.doctorId,
        req.user!.userId
      );
      return sendSuccess(res, result, 'Doctor assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  static async removeDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PatientService.removeDoctor(
        req.tenant!.clinicId,
        req.params.id,
        req.params.doctorId,
        req.user!.userId
      );
      return sendSuccess(res, result, 'Doctor unassigned successfully');
    } catch (error) {
      next(error);
    }
  }
}
