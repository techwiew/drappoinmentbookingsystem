import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';
import { getCurrentAppointmentTime, normalizeAppointmentTime } from '../../utils/time.js';

const ACTIVE_APPOINTMENT_STATUSES = ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] as const;

const toNullableString = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : String(value);
  return normalizedValue ? normalizedValue : null;
};

const toConsultationText = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'string' ? value.trim() : String(value);
};

const mapConsultation = (consultation: any) => ({
  ...consultation,
  doctorName: consultation.doctor.name,
  doctorSpecialization: consultation.doctor.specialization,
  doctorRegistrationNumber: consultation.doctor.registrationNumber,
  patientName: consultation.patient.fullName,
  patientNumber: consultation.patient.patientNumber,
  patientAge: consultation.patient.age,
  patientGender: consultation.patient.gender,
  patientAllergies: consultation.patient.allergies,
  prescription: consultation.prescription
    ? {
        id: consultation.prescription.id,
        prescribedAt: consultation.prescription.prescribedAt,
        items: consultation.prescription.items.map((item: any) => ({
          id: item.id,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
        })),
      }
    : null,
});

export class ConsultationService {
  static async listConsultations(
    clinicId: string,
    query: {
      appointmentId?: string;
      patientId?: string;
    }
  ) {
    const where: any = { clinicId };

    if (query.appointmentId) {
      where.appointmentId = query.appointmentId;
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    const consultations = await prisma.consultation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        appointment: true,
        patient: true,
        doctor: true,
        prescription: {
          include: { items: true },
        },
      },
    });

    return consultations.map(mapConsultation);
  }

  static async getConsultationById(clinicId: string, consultationId: string) {
    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, clinicId },
      include: {
        appointment: true,
        patient: true,
        doctor: true,
        prescription: {
          include: { items: true },
        },
      },
    });

    if (!consultation) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Consultation not found in this clinic' };
    }

    return mapConsultation(consultation);
  }

  static async getConsultationByAppointment(clinicId: string, appointmentId: string) {
    const consultation = await prisma.consultation.findFirst({
      where: { appointmentId, clinicId },
      include: {
        appointment: true,
        patient: true,
        doctor: true,
        prescription: {
          include: { items: true },
        },
      },
    });

    if (!consultation) {
      return null;
    }

    return mapConsultation(consultation);
  }

  static async createConsultation(
    clinicId: string,
    data: any,
    doctorId: string,
    doctorUserId: string
  ) {
    // Verify appointment belongs to clinic
    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, clinicId },
      include: { doctor: true, patient: true },
    });
    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' };
    }

    const docId = data.doctorId || appointment.doctorId || doctorId;
    const patientId = appointment.patientId;
    const chiefComplaint = toConsultationText(data.chiefComplaint) ?? '';
    const diagnosis = toConsultationText(data.diagnosis) ?? '';

    // Check if there's already an open (DRAFT) consultation for this appointment
    // If the new consultation is also DRAFT, we should prevent duplicates
    const isNewConsultationDraft = data.status === 'DRAFT';
    if (isNewConsultationDraft) {
      const existingDraftConsultation = await prisma.consultation.findFirst({
        where: {
          appointmentId: data.appointmentId,
          status: 'DRAFT',
        },
      });

      if (existingDraftConsultation) {
        throw {
          statusCode: 409,
          code: 'CONFLICT',
          message: 'An open consultation already exists for this appointment. Please complete or cancel it before starting a new one.'
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or Update Consultation
      const existing = await tx.consultation.findUnique({
        where: { appointmentId: data.appointmentId },
      });

      let consultation;
      if (existing) {
        if (existing.status === 'COMPLETED' && data.status !== 'COMPLETED') {
          throw { statusCode: 403, code: 'LOCKED', message: 'Completed consultations cannot be altered to draft' };
        }
        consultation = await tx.consultation.update({
          where: { id: existing.id },
          data: {
            chiefComplaint,
            symptoms: toNullableString(data.symptoms) ?? null,
            diagnosis,
            doctorNotes: toNullableString(data.doctorNotes) ?? null,
            advice: toNullableString(data.advice) ?? null,
            testsRecommended: toNullableString(data.testsRecommended) ?? null,
            nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
            followUpNotes: toNullableString(data.followUpNotes) ?? null,
            status: data.status || 'COMPLETED',
          },
        });
      } else {
        consultation = await tx.consultation.create({
          data: {
            clinicId,
            appointmentId: data.appointmentId,
            patientId,
            doctorId: docId,
            chiefComplaint,
            symptoms: toNullableString(data.symptoms) ?? null,
            diagnosis,
            doctorNotes: toNullableString(data.doctorNotes) ?? null,
            advice: toNullableString(data.advice) ?? null,
            testsRecommended: toNullableString(data.testsRecommended) ?? null,
            nextVisitDate: data.nextVisitDate
              ? new Date(data.nextVisitDate)
              : null,
            followUpNotes: toNullableString(data.followUpNotes) ?? null,
            status: data.status || 'COMPLETED',
          },
        });
      }

      // 2. Handle Prescriptions
      if (Array.isArray(data.medicines)) {
        let prescription = await tx.prescription.findUnique({
          where: { consultationId: consultation.id },
        });

        if (data.medicines.length === 0) {
          // Preserve the current prescription record so print/history access remains intact,
          // but allow the consultation save to treat it as an empty prescription payload.
        } else if (!prescription) {
          prescription = await tx.prescription.create({
            data: {
              clinicId,
              consultationId: consultation.id,
              patientId,
              doctorId: docId,
            },
          });
        } else {
          // Delete old items to overwrite
          await tx.prescriptionItem.deleteMany({
            where: { prescriptionId: prescription.id },
          });
        }

        if (prescription && data.medicines.length > 0) {
          for (const med of data.medicines) {
            await tx.prescriptionItem.create({
              data: {
                prescriptionId: prescription.id,
                medicineName: med.medicineName,
                dosage: med.dosage || '',
                frequency: med.frequency || '1-0-1',
                duration: med.duration || '5 days',
                instructions: med.instructions || null,
              },
            });
          }
        }
      }

      // 3. Mark appointment as COMPLETED if consultation is COMPLETED
      if (data.status === 'COMPLETED') {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: 'COMPLETED' },
        });

        // 4. Ensure payment invoice is generated if not present
        const existingPayment = await tx.payment.findFirst({
          where: { appointmentId: data.appointmentId },
        });

        if (!existingPayment) {
          await tx.payment.create({
            data: {
              clinicId,
              patientId,
              appointmentId: data.appointmentId,
              doctorId: docId,
              consultationFee: appointment.consultationFee,
              additionalFee: 0.0,
              discount: 0.0,
              totalAmount: appointment.consultationFee,
              paidAmount: 0.0,
              pendingAmount: appointment.consultationFee,
              paymentMethod: 'CASH',
              paymentStatus: 'PENDING',
            },
          });
        }
      }

      return consultation;
    });

    await logAudit({
      clinicId,
      userId: doctorUserId,
      action: 'CONSULTATION_CREATED',
      entityType: 'Consultation',
      entityId: result.id,
      metadata: { diagnosis: result.diagnosis, status: result.status },
    });

    const savedConsultation = await this.getConsultationById(clinicId, result.id);
    if (Array.isArray(data.medicines) && data.medicines.length === 0) {
      savedConsultation.prescription = null;
    }

    return savedConsultation;
  }

  static async openConsultationForPatient(
    clinicId: string,
    data: {
      patientId: string;
      doctorId?: string;
    },
    actor: {
      userId: string;
      doctorId?: string | null;
    }
  ) {
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, clinicId },
      include: {
        patientDoctors: {
          where: { status: 'ACTIVE' },
          orderBy: { assignedAt: 'asc' },
        },
      },
    });

    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const requestedDoctorId = data.doctorId || actor.doctorId || undefined;

    let appointment = await prisma.appointment.findFirst({
      where: {
        clinicId,
        patientId: data.patientId,
        ...(requestedDoctorId && { doctorId: requestedDoctorId }),
        appointmentDate: {
          gte: today,
          lt: nextDay,
        },
        status: {
          in: [...ACTIVE_APPOINTMENT_STATUSES],
        },
      },
      orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
    });

    const resolvedDoctorId =
      appointment?.doctorId ||
      requestedDoctorId ||
      patient.patientDoctors[0]?.doctorId ||
      (
        await prisma.doctor.findFirst({
          where: { clinicId, status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        })
      )?.id;

    if (!resolvedDoctorId) {
      throw {
        statusCode: 404,
        code: 'DOCTOR_NOT_FOUND',
        message: 'No active doctor is available to open a consultation',
      };
    }

    const existingOpenConsultation = appointment
      ? await prisma.consultation.findFirst({
          where: { appointmentId: appointment.id, status: 'DRAFT' },
        })
      : null;

    if (existingOpenConsultation && appointment) {
      // If there's an open consultation, ensure appointment is IN_CONSULTATION
      if (appointment.status !== 'IN_CONSULTATION') {
        appointment = await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: 'IN_CONSULTATION' },
        });
      }

      await logAudit({
        clinicId,
        userId: actor.userId,
        action: 'CONSULTATION_OPENED',
        entityType: 'Appointment',
        entityId: appointment.id,
        metadata: {
          patientId: data.patientId,
          doctorId: resolvedDoctorId,
          reusedAppointment: true,
          reusedConsultation: true,
        },
      });

      return {
        appointmentId: appointment.id,
        consultationId: existingOpenConsultation.id,
        patientId: data.patientId,
        doctorId: resolvedDoctorId,
        status: appointment.status,
      };
    }

    if (!appointment) {
      const doctor = await prisma.doctor.findFirst({
        where: { id: resolvedDoctorId, clinicId, status: 'ACTIVE' },
      });

      if (!doctor) {
        throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' };
      }

      const priorConsultations = await prisma.consultation.count({
        where: { clinicId, patientId: data.patientId },
      });

      appointment = await prisma.$transaction(async (tx) => {
        const existingTokens = await tx.appointment.count({
          where: {
            clinicId,
            doctorId: resolvedDoctorId,
            appointmentDate: {
              gte: today,
              lt: nextDay,
            },
          },
        });

        const createdAppointment = await tx.appointment.create({
          data: {
            clinicId,
            patientId: data.patientId,
            doctorId: resolvedDoctorId,
            appointmentDate: today,
            appointmentTime: normalizeAppointmentTime(getCurrentAppointmentTime()),
            appointmentType: priorConsultations > 0 ? 'FOLLOW_UP' : 'NEW_PATIENT',
            tokenNumber: existingTokens + 1,
            status: 'WAITING',
            consultationFee: doctor.consultationFee,
            createdBy: actor.userId,
          },
        });

        await tx.patientDoctor.upsert({
          where: {
            patientId_doctorId: {
              patientId: data.patientId,
              doctorId: resolvedDoctorId,
            },
          },
          create: {
            clinicId,
            patientId: data.patientId,
            doctorId: resolvedDoctorId,
            assignedBy: actor.userId,
          },
          update: { status: 'ACTIVE' },
        });

        return createdAppointment;
      });
    }

    if (appointment.status !== 'IN_CONSULTATION') {
      appointment = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'IN_CONSULTATION' },
      });
    }

    await logAudit({
      clinicId,
      userId: actor.userId,
      action: 'CONSULTATION_OPENED',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: {
        patientId: data.patientId,
        doctorId: resolvedDoctorId,
        reusedAppointment: false,
        reusedConsultation: false,
      },
    });

    return {
      appointmentId: appointment.id,
      consultationId: null,
      patientId: data.patientId,
      doctorId: resolvedDoctorId,
      status: appointment.status,
    };
  }

  static async updateConsultation(
    clinicId: string,
    consultationId: string,
    data: any,
    doctorUserId: string
  ) {
    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, clinicId },
      include: {
        appointment: true,
        patient: true,
        doctor: true,
      },
    });

    if (!consultation) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Consultation not found' };
    }

    if (consultation.status === 'COMPLETED') {
      throw { statusCode: 403, code: 'LOCKED', message: 'Completed consultations cannot be altered' };
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update consultation
      const updatedConsultation = await tx.consultation.update({
        where: { id: consultationId },
        data: {
          ...(data.chiefComplaint !== undefined && {
            chiefComplaint: toConsultationText(data.chiefComplaint) ?? '',
          }),
          ...(data.symptoms !== undefined && { symptoms: toNullableString(data.symptoms) ?? null }),
          ...(data.diagnosis !== undefined && {
            diagnosis: toConsultationText(data.diagnosis) ?? '',
          }),
          ...(data.doctorNotes !== undefined && {
            doctorNotes: toNullableString(data.doctorNotes) ?? null,
          }),
          ...(data.advice !== undefined && { advice: toNullableString(data.advice) ?? null }),
          ...(data.testsRecommended !== undefined && {
            testsRecommended: toNullableString(data.testsRecommended) ?? null,
          }),
          ...(data.nextVisitDate !== undefined && {
            nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
          }),
          ...(data.followUpNotes !== undefined && {
            followUpNotes: toNullableString(data.followUpNotes) ?? null,
          }),
          ...(data.status && { status: data.status }),
        },
      });

      // 2. Handle prescription items if provided
      if (Array.isArray(data.medicines)) {
        let prescription = await tx.prescription.findFirst({
          where: { consultationId: consultationId },
        });

        if (data.medicines.length === 0) {
          // Preserve any earlier prescription record for print/history access, while
          // allowing the no-prescription save to present a null payload to the client.
        } else if (!prescription) {
          prescription = await tx.prescription.create({
            data: {
              clinicId,
              consultationId,
              patientId: consultation.patientId,
              doctorId: consultation.doctor.id,
            },
          });
        } else {
          // Delete existing items
          await tx.prescriptionItem.deleteMany({
            where: { prescriptionId: prescription.id },
          });
        }

        // Create prescription items if prescription exists
        if (prescription && data.medicines.length > 0) {
          for (const med of data.medicines) {
            await tx.prescriptionItem.create({
              data: {
                prescriptionId: prescription.id,
                medicineName: med.medicineName,
                dosage: med.dosage || '',
                frequency: med.frequency || '1-0-1',
                duration: med.duration || '5 days',
                instructions: med.instructions || null,
              },
            });
          }
        }
      }

      // 3. If status is COMPLETED, update appointment and ensure payment invoice
      if (data.status === 'COMPLETED') {
        // Update appointment status
        await tx.appointment.update({
          where: { id: consultation.appointmentId },
          data: { status: 'COMPLETED' },
        });

        // Ensure payment invoice exists
        const existingPayment = await tx.payment.findFirst({
          where: { appointmentId: consultation.appointmentId },
        });

        if (!existingPayment) {
          await tx.payment.create({
            data: {
              clinicId,
              patientId: consultation.patientId,
              appointmentId: consultation.appointmentId,
              doctorId: consultation.doctor.id,
              consultationFee: consultation.appointment.consultationFee,
              additionalFee: 0.0,
              discount: 0.0,
              totalAmount: consultation.appointment.consultationFee,
              paidAmount: 0.0,
              pendingAmount: consultation.appointment.consultationFee,
              paymentMethod: 'CASH',
              paymentStatus: 'PENDING',
            },
          });
        }
      }

      return updatedConsultation;
    });

    await logAudit({
      clinicId,
      userId: doctorUserId,
      action: 'CONSULTATION_UPDATED',
      entityType: 'Consultation',
      entityId: consultationId,
    });

    return this.getConsultationById(clinicId, consultationId);
  }
}
