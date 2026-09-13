import { Router } from 'express';
import { ContactController } from './contact.controller.js';
import { validateRequest } from '../../middlewares/validate.js';
import { inquirySchema } from './contact.schema.js';

const router = Router();

router.post('/', validateRequest(inquirySchema), ContactController.createInquiry);

export default router;