import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, req.ip);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);
      return sendSuccess(res, result, 'Token refreshed');
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
      const result = await AuthService.getMe(req.user!.userId);
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
}
