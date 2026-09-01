import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';

export class ClinicService {
  static async getProfile(clinicId: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            doctors: true,
            receptionists: true,
            patients: true,
            appointments: true,
          },
        },
      },
    });

    if (!clinic) {
      throw { statusCode: 404, code: 'CLINIC_NOT_FOUND', message: 'Clinic profile not found' };
    }

    return {
      ...clinic,
      subscription: clinic.subscription
        ? {
            id: clinic.subscription.id,
            planName: clinic.subscription.plan.name,
            planCode: clinic.subscription.plan.code,
            price: Number(clinic.subscription.plan.price),
            status: clinic.subscription.status,
            startDate: clinic.subscription.startDate,
            endDate: clinic.subscription.endDate,
            billingCycle: clinic.subscription.billingCycle,
            maxDoctors: clinic.subscription.plan.maxDoctors,
            maxReceptionists: clinic.subscription.plan.maxReceptionists,
            features: JSON.parse(clinic.subscription.plan.features || '[]'),
          }
        : null,
      stats: {
        totalDoctors: clinic._count.doctors,
        totalReceptionists: clinic._count.receptionists,
        totalPatients: clinic._count.patients,
        totalAppointments: clinic._count.appointments,
      },
    };
  }

  static async updateProfile(clinicId: string, data: any, updaterUserId: string) {
    const updated = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.address && { address: data.address }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.pincode && { pincode: data.pincode }),
        ...(data.tokenPrefix && { tokenPrefix: data.tokenPrefix.toUpperCase() }),
      },
    });

    await logAudit({
      clinicId,
      userId: updaterUserId,
      action: 'CLINIC_PROFILE_UPDATED',
      entityType: 'Clinic',
      entityId: clinicId,
    });

    return updated;
  }
}
