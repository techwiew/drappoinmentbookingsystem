import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middlewares/validate.js';
import { loginSchema, refreshSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyAndChangePasswordSchema, verifyResetOtpSchema } from './auth.schema.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/verify-reset-otp', validateRequest(verifyResetOtpSchema), AuthController.verifyResetOtp);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);
router.post('/refresh', validateRequest(refreshSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post(
  '/change-password',
  authenticate,
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);
router.post(
  '/verify-and-change-password',
  validateRequest(verifyAndChangePasswordSchema),
  AuthController.verifyAndChangePassword
);

export default router;
