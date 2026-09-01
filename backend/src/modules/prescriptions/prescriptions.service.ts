import { prisma } from '../../lib/prisma.js';

export class PrescriptionService {
  static async getPrescriptionById(clinicId: string, prescriptionId: string) {
    const rx = await prisma.prescription.findFirst({
      where: { id: prescriptionId, clinicId },
      include: {
        clinic: true,
        patient: true,
        doctor: true,
        consultation: true,
        items: true,
      },
    });

    if (!rx) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Prescription not found' };
    }

    return {
      id: rx.id,
      prescribedAt: rx.prescribedAt,
      clinic: {
        name: rx.clinic.name,
        address: rx.clinic.address,
        phone: rx.clinic.phone,
        email: rx.clinic.email,
        logo: rx.clinic.logo,
      },
      doctor: {
        id: rx.doctor.id,
        name: rx.doctor.name,
        specialization: rx.doctor.specialization,
        qualification: rx.doctor.qualification,
        registrationNumber: rx.doctor.registrationNumber,
      },
      patient: {
        id: rx.patient.id,
        patientNumber: rx.patient.patientNumber,
        fullName: rx.patient.fullName,
        age: rx.patient.age,
        gender: rx.patient.gender,
        mobile: rx.patient.mobile,
        allergies: rx.patient.allergies,
      },
      diagnosis: rx.consultation?.diagnosis,
      advice: rx.consultation?.advice,
      nextVisitDate: rx.consultation?.nextVisitDate,
      items: rx.items.map((i) => ({
        id: i.id,
        medicineName: i.medicineName,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        instructions: i.instructions,
      })),
    };
  }
}
