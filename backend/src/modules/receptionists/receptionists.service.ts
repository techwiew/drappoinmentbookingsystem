import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';
import { logAudit } from '../../middlewares/audit.js';

export class ReceptionistService {
  static async listReceptionists(clinicId: string) {
    return prisma.receptionist.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async createReceptionist(clinicId: string, data: any, creatorUserId: string) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { maxReceptionists: true } });
    if (!clinic) {
      throw { statusCode: 404, code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' };
    }
    const receptionistCount = await prisma.receptionist.count({ where: { clinicId, status: 'ACTIVE' } });
    if (receptionistCount >= clinic.maxReceptionists) {
      throw { statusCode: 409, code: 'RECEPTIONIST_QUOTA_EXCEEDED', message: `This clinic has reached its limit of ${clinic.maxReceptionists} active receptionists` };
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingUser) {
      throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'An account with this email address already exists' };
    }

    const hashedPassword = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash: hashedPassword,
          role: 'RECEPTIONIST',
          status: 'ACTIVE',
        },
      });

      await tx.clinicUser.create({
        data: {
          clinicId,
          userId: user.id,
          role: 'RECEPTIONIST',
          isOwner: false,
        },
      });

      const receptionist = await tx.receptionist.create({
        data: {
          clinicId,
          userId: user.id,
          name: data.name,
          email: data.email.toLowerCase(),
          mobile: data.mobile,
          status: 'ACTIVE',
        },
      });

      return receptionist;
    });

    await logAudit({
      clinicId,
      userId: creatorUserId,
      action: 'RECEPTIONIST_CREATED',
      entityType: 'Receptionist',
      entityId: result.id,
      metadata: { name: result.name },
    });

    return result;
  }

  static async updateReceptionist(clinicId: string, receptionistId: string, data: any, updaterUserId: string) {
    const receptionist = await prisma.receptionist.findFirst({
      where: { id: receptionistId, clinicId },
    });
    if (!receptionist) {
      throw { statusCode: 404, code: 'RECEPTIONIST_NOT_FOUND', message: 'Receptionist not found in this clinic' };
    }

    const updated = await prisma.receptionist.update({
      where: { id: receptionistId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.mobile && { mobile: data.mobile }),
        ...(data.status && { status: data.status }),
      },
    });

    await logAudit({
      clinicId,
      userId: updaterUserId,
      action: 'RECEPTIONIST_UPDATED',
      entityType: 'Receptionist',
      entityId: receptionistId,
    });

    return updated;
  }
}
