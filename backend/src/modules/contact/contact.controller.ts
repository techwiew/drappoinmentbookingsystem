import { Request, Response, NextFunction } from 'express';
import { ContactService } from './contact.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ContactController {
  static async createInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, clinicType, city } = req.body;
      const result = await ContactService.createInquiry({ name, phone, clinicType, city });
      return sendSuccess(res, result, 'Inquiry submitted successfully');
    } catch (error) {
      next(error);
    }
  }
}