import { prisma } from '../../lib/prisma.js';

export class ContactService {
  static async createInquiry(data: {
    name: string;
    phone: string;
    clinicType: string;
    city: string;
  }) {
    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        clinicType: data.clinicType.trim(),
        city: data.city.trim(),
      },
    });

    return inquiry;
  }
}