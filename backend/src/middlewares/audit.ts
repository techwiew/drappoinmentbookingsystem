import { prisma } from '../lib/prisma.js';

export interface AuditParams {
  clinicId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
}

export const logAudit = async (params: AuditParams) => {
  try {
    await prisma.auditLog.create({
      data: {
        clinicId: params.clinicId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: null,
        ipAddress: null,
      },
    });
  } catch (error) {
    console.error('[Audit Logging Failed]');
  }
};
