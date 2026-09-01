import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middlewares/audit.js';

export class ConsultationService {
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

    return {
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
            items: consultation.prescription.items.map((i) => ({
              id: i.id,
              medicineName: i.medicineName,
              dosage: i.dosage,
              frequency: i.frequency,
              duration: i.duration,
              instructions: i.instructions,
            })),
          }
        : null,
    };
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

    return {
      ...consultation,
      doctorName: consultation.doctor.name,
      doctorSpecialization: consultation.doctor.specialization,
      patientName: consultation.patient.fullName,
      patientNumber: consultation.patient.patientNumber,
      prescription: consultation.prescription
        ? {
            id: consultation.prescription.id,
            prescribedAt: consultation.prescription.prescribedAt,
            items: consultation.prescription.items,
          }
        : null,
    };
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
            chiefComplaint: data.chiefComplaint,
            symptoms: data.symptoms || null,
            diagnosis: data.diagnosis,
            doctorNotes: data.doctorNotes || null,
            advice: data.advice || null,
            testsRecommended: data.testsRecommended || null,
            nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
            followUpNotes: data.followUpNotes || null,
            status: data.status || 'COMPLETED',
          },
        });
      } else {
        consultation = await tx.consultation.create({
          data: {
            clinicId,
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            doctorId: docId,
            chiefComplaint: data.chiefComplaint,
            symptoms: data.symptoms || null,
            diagnosis: data.diagnosis,
            doctorNotes: data.doctorNotes || null,
            advice: data.advice || null,
            testsRecommended: data.testsRecommended || null,
            nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
            followUpNotes: data.followUpNotes || null,
            status: data.status || 'COMPLETED',
          },
        });
      }

      // 2. Handle Prescriptions
      if (data.medicines && data.medicines.length > 0) {
        let prescription = await tx.prescription.findUnique({
          where: { consultationId: consultation.id },
        });

        if (!prescription) {
          prescription = await tx.prescription.create({
            data: {
              clinicId,
              consultationId: consultation.id,
              patientId: data.patientId,
              doctorId: docId,
            },
          });
        } else {
          // Delete old items to overwrite
          await tx.prescriptionItem.deleteMany({
            where: { prescriptionId: prescription.id },
          });
        }

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
              patientId: data.patientId,
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

    return this.getConsultationById(clinicId, result.id);
  }

  static async updateConsultation(
    clinicId: string,
    consultationId: string,
    data: any,
    doctorUserId: string
  ) {
    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, clinicId },
    });
    if (!consultation) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Consultation not found' };
    }

    const updated = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        ...(data.chiefComplaint && { chiefComplaint: data.chiefComplaint }),
        ...(data.symptoms !== undefined && { symptoms: data.symptoms }),
        ...(data.diagnosis && { diagnosis: data.diagnosis }),
        ...(data.doctorNotes !== undefined && { doctorNotes: data.doctorNotes }),
        ...(data.advice !== undefined && { advice: data.advice }),
        ...(data.testsRecommended !== undefined && { testsRecommended: data.testsRecommended }),
        ...(data.nextVisitDate && { nextVisitDate: new Date(data.nextVisitDate) }),
        ...(data.followUpNotes !== undefined && { followUpNotes: data.followUpNotes }),
        ...(data.status && { status: data.status }),
      },
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
