import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { setAuthCookies } from '../../utils/cookie.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, req.ip);

      // Set auth cookies
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // Return user data without tokens
      return sendSuccess(res, { user: result.user }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);

      // Set auth cookies
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // Return user data without tokens
      return sendSuccess(res, { user: result.user }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.requestPasswordReset(req.body.email);
      return sendSuccess(res, result, 'A six-digit verification code has been sent to your registered email address.');
    } catch (error) {
      next(error);
    }
  }

  static async verifyResetOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.verifyPasswordResetOtp(req.body.email, req.body.otp);
      return sendSuccess(res, result, 'Code verified. Set your new password.');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.resetPassword(req.body.token, req.body.newPassword);
      return sendSuccess(res, { updated: true }, 'Password reset successfully. Please sign in.');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.userId) {
        await AuthService.logout(req.user.userId);
      }
      return sendSuccess(res, { loggedOut: true }, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.getMe(req.user!.userId, req.tenant?.clinicId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user!.userId, currentPassword, newPassword);
      return sendSuccess(res, { updated: true }, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async verifyAndChangePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile, oldPassword, newPassword } = req.body;
      await AuthService.verifyAndChangePassword(email, mobile, oldPassword, newPassword);
      return sendSuccess(res, { updated: true }, 'Password changed successfully. Please sign in with your new password.');
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.deleteAccount(req.user!.userId);
      return sendSuccess(res, { deleted: true }, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
