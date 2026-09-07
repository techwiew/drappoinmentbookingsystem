import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';
import { logAudit } from '../../middlewares/audit.js';

export class SuperAdminService {
  static async getDashboardStats() {
    const totalClinics = await prisma.clinic.count();
    const activeClinics = await prisma.clinic.count({
      where: { status: "ACTIVE" },
    });
    const trialClinics = await prisma.clinic.count({
      where: { status: "TRIAL" },
    });
    const expiredClinics = await prisma.clinic.count({
      where: { status: "EXPIRED" },
    });
    const totalDoctors = await prisma.doctor.count({
      where: { status: "ACTIVE" },
    });
    const totalReceptionists = await prisma.receptionist.count({
      where: { status: "ACTIVE" },
    });
    const totalPatients = await prisma.patient.count();
    const totalAppointments = await prisma.appointment.count();

    // Calculate Monthly Recurring Revenue (MRR)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    });

    const mrr = activeSubscriptions.reduce((acc, sub) => {
      const amount = Number(sub.amount || sub.plan.price);
      return acc + (sub.billingCycle === "YEARLY" ? amount / 12 : amount);
    }, 0);

    // Distribution by plan
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    const planDistribution = plans.map((p) => ({
      planName: p.name,
      code: p.code,
      count: p._count.subscriptions,
      price: Number(p.price),
    }));

    // Recent clinics
    const recentClinics = await prisma.clinic.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: {
            doctors: true,
            patients: true,
            appointments: true,
          },
        },
      },
    });

    return {
      metrics: {
        totalClinics,
        activeClinics,
        trialClinics,
        expiredClinics,
        totalDoctors,
        totalReceptionists,
        totalPatients,
        totalAppointments,
        mrr: Math.round(mrr),
      },
      planDistribution,
      recentClinics: recentClinics.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        city: c.city,
        status: c.status,
        planName: c.subscription?.plan?.name || "No Plan",
        subscriptionStatus: c.subscription?.status || "INACTIVE",
        doctorCount: c._count.doctors,
        patientCount: c._count.patients,
        appointmentCount: c._count.appointments,
        createdAt: c.createdAt,
      })),
    };
  }

  static async listClinics(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { city: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }
    if (query.status && query.status !== "ALL") {
      where.status = query.status;
    }

    const [total, clinics] = await Promise.all([
      prisma.clinic.count({ where }),
      prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          subscription: {
            include: { plan: true },
          },
          _count: {
            select: {
              doctors: true,
              receptionists: true,
              patients: true,
            },
          },
        },
      }),
    ]);

    return {
      clinics: clinics.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        address: c.address,
        phone: c.phone,
        email: c.email,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        tokenPrefix: c.tokenPrefix,
        status: c.status,
        subscription: c.subscription
          ? {
              planName: c.subscription.plan.name,
              status: c.subscription.status,
              endDate: c.subscription.endDate,
              amount: Number(c.subscription.amount),
            }
          : null,
        doctorCount: c._count.doctors,
        receptionistCount: c._count.receptionists,
        patientCount: c._count.patients,
        createdAt: c.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createClinic(data: any, superAdminId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail.toLowerCase() },
    });
    if (existingUser) {
      throw {
        statusCode: 409,
        code: "EMAIL_EXISTS",
        message: "An account with this email address already exists",
      };
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      orderBy: { price: "asc" },
    });
    if (!plan) {
      throw {
        statusCode: 404,
        code: "PLAN_NOT_FOUND",
        message: "Create a subscription plan before adding a clinic",
      };
    }

    const hashedPassword = await hashPassword(data.adminPassword);
    const baseSlug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "clinic";
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.clinic.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }
    const tokenPrefix =
      data.name
        .split(/\s+/)
        .map((word: string) => word[0])
        .join("")
        .replace(/[^a-z]/gi, "")
        .toUpperCase()
        .slice(0, 4) || "TKN";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Clinic
      const clinic = await tx.clinic.create({
        data: {
          name: data.name,
          slug,
          address: data.address,
          phone: data.phone,
          email: data.email,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          tokenPrefix,
          status: "ACTIVE",
        },
      });

      // 2. Create Admin Doctor User
      const user = await tx.user.create({
        data: {
          email: data.adminEmail.toLowerCase(),
          passwordHash: hashedPassword,
          role: "DOCTOR",
          status: "ACTIVE",
        },
      });

      // 3. Connect User to Clinic
      await tx.clinicUser.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          role: "DOCTOR",
          isOwner: true,
        },
      });

      // 4. Create Doctor Profile
      await tx.doctor.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          name: data.adminName,
          email: data.adminEmail.toLowerCase(),
          mobile: data.adminMobile,
          specialization: data.specialization,
          qualification: data.qualification,
          registrationNumber: data.registrationNumber,
          consultationFee: data.consultationFee,
          status: "ACTIVE",
          workingDays: JSON.stringify(["MON", "TUE", "WED", "THU", "FRI", "SAT"]),
          workingHours: JSON.stringify({ start: "09:00", end: "17:00" }),
        },
      });

      // 5. Create Active Subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + data.activeMonths);

      await tx.subscription.create({
        data: {
          clinicId: clinic.id,
          planId: plan.id,
          status: "ACTIVE",
          startDate,
          endDate,
          billingCycle: "MONTHLY",
          amount: data.planPrice,
        },
      });

      return clinic;
    });

    await logAudit({
      userId: superAdminId,
      action: "CLINIC_CREATED",
      entityType: "Clinic",
      entityId: result.id,
      metadata: { name: result.name, slug: result.slug },
    });

    return result;
  }

  static async updateClinicStatus(
    clinicId: string,
    status: string,
    superAdminId: string,
  ) {
    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: { status: status as any },
    });

    await logAudit({
      userId: superAdminId,
      clinicId,
      action: "CLINIC_STATUS_UPDATED",
      entityType: "Clinic",
      entityId: clinicId,
      metadata: { newStatus: status },
    });

    return clinic;
  }

  static async listPlans() {
    return prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
    });
  }
}
