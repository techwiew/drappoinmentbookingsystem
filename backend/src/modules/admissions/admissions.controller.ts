import { Request, Response, NextFunction } from 'express';
import { AdmissionService } from './admissions.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AdmissionController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const admissions = await AdmissionService.listAdmissions(req.tenant!.clinicId, {
        status: req.query.status as string | undefined,
        patientId: req.query.patientId as string | undefined,
      });
      return sendSuccess(res, admissions);
    } catch (error) { next(error); }
  }

  static async admit(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await AdmissionService.admitPatient(req.tenant!.clinicId, req.body, req.user!.userId);
      return sendSuccess(res, admission, 'Patient admitted successfully', 201);
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await AdmissionService.updateAdmission(req.tenant!.clinicId, req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, admission, 'Admission updated');
    } catch (error) { next(error); }
  }

  static async payment(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await AdmissionService.recordPayment(req.tenant!.clinicId, req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, admission, 'Admission payment recorded');
    } catch (error) { next(error); }
  }

  static async discharge(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await AdmissionService.discharge(req.tenant!.clinicId, req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, admission, 'Patient discharged successfully');
    } catch (error) { next(error); }
  }
}
