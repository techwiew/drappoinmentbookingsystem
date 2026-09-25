import { RoleType } from '../constants/index.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        userId: string;
        email: string;
        role: RoleType;
        clinicId?: string;
        doctorId?: string;
        receptionistId?: string;
      };
      tenant?: {
        clinicId: string;
        clinicName: string;
        role: RoleType;
        isOwner: boolean;
        doctorId?: string;
        receptionistId?: string;
      };
    }
  }
}

declare module '../utils/cookie.js' {
  export const setAuthCookies: (
    res: import('express').Response,
    accessToken: string,
    refreshToken: string
  ) => void;
  
  export const clearAuthCookies: (res: import('express').Response) => void;
  
  export const getTokenFromCookie: (
    req: import('express').Request,
    cookieName: string
  ) => string | null;
}
