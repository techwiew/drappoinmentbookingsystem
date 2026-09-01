import { RoleType } from '../constants/index.js';

declare global {
  namespace Express {
    interface Request {
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
