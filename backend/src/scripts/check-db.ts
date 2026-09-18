import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const [userCount, clinicCount, clinic, admissionCount] = await Promise.all([
      prisma.user.count(),
      prisma.clinic.count(),
      prisma.clinic.findFirst({ select: { id: true, maxDoctors: true, maxReceptionists: true } }),
      prisma.admission.count(),
    ]);

    console.log('Database connection: OK');
    console.log(`DATABASE_URL configured: ${process.env.DATABASE_URL ? 'yes' : 'no'}`);
    console.log(`Users: ${userCount}`);
    console.log(`Clinics: ${clinicCount}`);
    console.log(`Admissions: ${admissionCount}`);
    if (clinic) console.log(`Clinic staff limits: ${clinic.maxDoctors} doctors, ${clinic.maxReceptionists} receptionists`);
  } catch (error) {
    console.error('Database connection: FAILED');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void checkDatabaseConnection();
