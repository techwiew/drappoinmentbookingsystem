import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const [userCount, clinicCount] = await Promise.all([
      prisma.user.count(),
      prisma.clinic.count(),
    ]);

    console.log('Database connection: OK');
    console.log(`DATABASE_URL configured: ${process.env.DATABASE_URL ? 'yes' : 'no'}`);
    console.log(`Users: ${userCount}`);
    console.log(`Clinics: ${clinicCount}`);
  } catch (error) {
    console.error('Database connection: FAILED');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void checkDatabaseConnection();