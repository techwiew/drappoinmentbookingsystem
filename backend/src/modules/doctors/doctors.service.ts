import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';
import { logAudit } from '../../middlewares/audit.js';

export class DoctorService {
  static async listDoctors(clinicId: string) {
    const doctors = await prisma.doctor.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            patientDoctors: true,
            appointments: true,
            consultations: true,
          },
        },
      },
    });

    return doctors.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      mobile: d.mobile,
      specialization: d.specialization,
      qualification: d.qualification,
      registrationNumber: d.registrationNumber,
      consultationFee: Number(d.consultationFee),
      status: d.status,
      workingDays: JSON.parse(d.workingDays || '[]'),
      workingHours: JSON.parse(d.workingHours || '{}'),
      assignedPatientsCount: d._count.patientDoctors,
      totalAppointmentsCount: d._count.appointments,
      totalConsultationsCount: d._count.consultations,
      createdAt: d.createdAt,
    }));
  }

  static async createDoctor(clinicId: string, data: any, creatorUserId: string) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { maxDoctors: true } });
    if (!clinic) {
      throw { statusCode: 404, code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' };
    }
    const doctorCount = await prisma.doctor.count({ where: { clinicId, status: 'ACTIVE' } });
    if (doctorCount >= clinic.maxDoctors) {
      throw { statusCode: 409, code: 'DOCTOR_QUOTA_EXCEEDED', message: `This clinic has reached its limit of ${clinic.maxDoctors} active doctors` };
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
          role: 'DOCTOR',
          status: 'ACTIVE',
        },
      });

      await tx.clinicUser.create({
        data: {
          clinicId,
          userId: user.id,
          role: 'DOCTOR',
          isOwner: false,
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          clinicId,
          userId: user.id,
          name: data.name,
          email: data.email.toLowerCase(),
          mobile: data.mobile,
          specialization: data.specialization,
          qualification: data.qualification,
          registrationNumber: data.registrationNumber,
          consultationFee: data.consultationFee,
          status: 'ACTIVE',
          workingDays: JSON.stringify(data.workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
          workingHours: JSON.stringify(data.workingHours || { start: '09:00', end: '17:00' }),
        },
      });

      return doctor;
    });

    await logAudit({
      clinicId,
      userId: creatorUserId,
      action: 'DOCTOR_CREATED',
      entityType: 'Doctor',
      entityId: result.id,
      metadata: { name: result.name, specialization: result.specialization },
    });

    return result;
  }

  static async updateDoctor(clinicId: string, doctorId: string, data: any, updaterUserId: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, clinicId },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this clinic' };
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.registrationNumber !== undefined) updateData.registrationNumber = data.registrationNumber;
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.workingDays !== undefined) updateData.workingDays = JSON.stringify(data.workingDays);
    if (data.workingHours !== undefined) updateData.workingHours = JSON.stringify(data.workingHours);

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
    });

    await logAudit({
      clinicId,
      userId: updaterUserId,
      action: 'DOCTOR_UPDATED',
      entityType: 'Doctor',
      entityId: doctorId,
    });

    return updated;
  }
}
