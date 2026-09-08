import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patientDoctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.receptionist.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.clinicUser.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();

  const superAdminPassword = await bcrypt.hash('Admin@123', 10);
  const realSuperAdminPassword = await bcrypt.hash("SuperAdmin@123", 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const receptionistPassword = await bcrypt.hash('Reception@123', 10);

  // 1. Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@MediNovel.com",
      passwordHash: superAdminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("✅ Super Admin created: admin@MediNovel.com");

  await prisma.user.create({
    data: {
      email: "superadmin@MediNovel.com",
      passwordHash: realSuperAdminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("✅ Real Super Admin created: superadmin@MediNovel.com");

  // 2. Create Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Starter Solo',
      code: 'STARTER',
      price: 1999.0,
      billingCycle: 'MONTHLY',
      maxDoctors: 1,
      maxReceptionists: 2,
      features: JSON.stringify(['1 Doctor', '2 Receptionists', 'Daily Queue', 'Prescriptions', 'Basic Reports']),
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Professional Clinic',
      code: 'PROFESSIONAL',
      price: 4999.0,
      billingCycle: 'MONTHLY',
      maxDoctors: 5,
      maxReceptionists: 5,
      features: JSON.stringify(['Up to 5 Doctors', '5 Receptionists', 'Multi-Queue', 'POS Billing', 'Advanced Analytics', 'SMS Alerts']),
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Polyclinic Enterprise',
      code: 'CLINIC',
      price: 9999.0,
      billingCycle: 'MONTHLY',
      maxDoctors: 20,
      maxReceptionists: 15,
      features: JSON.stringify(['Unlimited Doctors', 'Unlimited Staff', 'Multi-Branch Ready', 'Custom Rx Letterhead', 'API Access', 'Dedicated Support']),
    },
  });
  console.log('✅ Subscription plans seeded');

  // 3. Create Demo Clinic: Sharma Healthcare & Polyclinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Sharma Healthcare & Polyclinic',
      slug: 'sharma-clinic',
      logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150',
      address: 'Suite 402, Metro Health Plaza, Linking Road',
      phone: '+91 98201 23456',
      email: 'contact@sharmaclinic.com',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      tokenPrefix: 'SHC',
      status: 'ACTIVE',
    },
  });

  // Assign Subscription to Clinic
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  await prisma.subscription.create({
    data: {
      clinicId: clinic.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      startDate: now,
      endDate: nextYear,
      billingCycle: 'MONTHLY',
      amount: 4999.0,
    },
  });
  console.log('✅ Demo clinic created with Active Pro Subscription');

  // 4. Create Doctor 1: Dr. Raj Sharma (Cardiologist)
  const doc1User = await prisma.user.create({
    data: {
      email: 'dr.raj@sharmaclinic.com',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  await prisma.clinicUser.create({
    data: {
      clinicId: clinic.id,
      userId: doc1User.id,
      role: 'DOCTOR',
      isOwner: true,
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      userId: doc1User.id,
      name: 'Dr. Raj Sharma',
      email: 'dr.raj@sharmaclinic.com',
      mobile: '+91 98200 11223',
      specialization: 'Cardiology & Internal Medicine',
      qualification: 'MBBS, MD (Cardiology), FACC',
      registrationNumber: 'MCI-2012-45892',
      consultationFee: 700.0,
      status: 'ACTIVE',
      workingDays: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
      workingHours: JSON.stringify({ start: '09:00', end: '17:00' }),
    },
  });

  // Create Doctor 2: Dr. Priya Patel (General Physician)
  const doc2User = await prisma.user.create({
    data: {
      email: 'dr.priya@sharmaclinic.com',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  await prisma.clinicUser.create({
    data: {
      clinicId: clinic.id,
      userId: doc2User.id,
      role: 'DOCTOR',
      isOwner: false,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      userId: doc2User.id,
      name: 'Dr. Priya Patel',
      email: 'dr.priya@sharmaclinic.com',
      mobile: '+91 98200 44556',
      specialization: 'Consultant Physician & Diabetologist',
      qualification: 'MBBS, DNB (Family Medicine)',
      registrationNumber: 'MCI-2016-89123',
      consultationFee: 500.0,
      status: 'ACTIVE',
      workingDays: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI']),
      workingHours: JSON.stringify({ start: '10:00', end: '18:00' }),
    },
  });
  console.log('✅ Doctors seeded: Dr. Raj Sharma & Dr. Priya Patel');

  // 5. Create Receptionists
  const rec1User = await prisma.user.create({
    data: {
      email: 'reception@sharmaclinic.com',
      passwordHash: receptionistPassword,
      role: 'RECEPTIONIST',
      status: 'ACTIVE',
    },
  });

  await prisma.clinicUser.create({
    data: {
      clinicId: clinic.id,
      userId: rec1User.id,
      role: 'RECEPTIONIST',
      isOwner: false,
    },
  });

  await prisma.receptionist.create({
    data: {
      clinicId: clinic.id,
      userId: rec1User.id,
      name: 'Anjali Verma',
      email: 'reception@sharmaclinic.com',
      mobile: '+91 98200 77889',
      status: 'ACTIVE',
    },
  });

  const rec2User = await prisma.user.create({
    data: {
      email: 'vikram@sharmaclinic.com',
      passwordHash: receptionistPassword,
      role: 'RECEPTIONIST',
      status: 'ACTIVE',
    },
  });

  await prisma.clinicUser.create({
    data: {
      clinicId: clinic.id,
      userId: rec2User.id,
      role: 'RECEPTIONIST',
      isOwner: false,
    },
  });

  await prisma.receptionist.create({
    data: {
      clinicId: clinic.id,
      userId: rec2User.id,
      name: 'Vikram Singh',
      email: 'vikram@sharmaclinic.com',
      mobile: '+91 98200 99001',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Receptionists seeded');

  // 6. Seed 10 Realistic Demo Patients
  const patientsData = [
    {
      patientNumber: 'P-1001',
      fullName: 'Rahul Verma',
      gender: 'MALE',
      age: 42,
      mobile: '9820199101',
      email: 'rahul.verma@example.com',
      bloodGroup: 'B+',
      allergies: 'Penicillin, Sulfa drugs',
      existingIllness: 'Hypertension',
      medicalConditions: 'Stage 1 Essential Hypertension diagnosed 2021',
      emergencyContactName: 'Sunita Verma (Wife)',
      emergencyContactRelationship: 'Spouse',
      emergencyContactMobile: '9820199102',
      doctors: [doctor1.id, doctor2.id],
    },
    {
      patientNumber: 'P-1002',
      fullName: 'Meera Deshmukh',
      gender: 'FEMALE',
      age: 35,
      mobile: '9820199103',
      email: 'meera.d@example.com',
      bloodGroup: 'O+',
      allergies: 'None reported',
      existingIllness: 'Hypothyroidism',
      medicalConditions: 'Thyroiditis on levothyroxine 50mcg',
      emergencyContactName: 'Kishore Deshmukh',
      emergencyContactRelationship: 'Husband',
      emergencyContactMobile: '9820199104',
      doctors: [doctor2.id],
    },
    {
      patientNumber: 'P-1003',
      fullName: 'Aarav Mehta',
      gender: 'MALE',
      age: 28,
      mobile: '9820199105',
      email: 'aarav.m@example.com',
      bloodGroup: 'A+',
      allergies: 'Dust mites',
      existingIllness: 'Seasonal Bronchitis',
      medicalConditions: 'Mild wheezing on exertion',
      emergencyContactName: 'Pooja Mehta',
      emergencyContactRelationship: 'Mother',
      emergencyContactMobile: '9820199106',
      doctors: [doctor1.id],
    },
    {
      patientNumber: 'P-1004',
      fullName: 'Sunita Kapoor',
      gender: 'FEMALE',
      age: 58,
      mobile: '9820199107',
      email: 'sunita.k@example.com',
      bloodGroup: 'AB+',
      allergies: 'Aspirin',
      existingIllness: 'Type 2 Diabetes, High Cholesterol',
      medicalConditions: 'HbA1c 7.4%, Dyslipidemia',
      emergencyContactName: 'Ramesh Kapoor',
      emergencyContactRelationship: 'Husband',
      emergencyContactMobile: '9820199108',
      doctors: [doctor1.id, doctor2.id],
    },
    {
      patientNumber: 'P-1005',
      fullName: 'Kavita Joshi',
      gender: 'FEMALE',
      age: 24,
      mobile: '9820199109',
      email: 'kavita.j@example.com',
      bloodGroup: 'O-',
      allergies: 'Peanuts',
      existingIllness: 'Migraine',
      medicalConditions: 'Frequent episodic tension headache',
      emergencyContactName: 'Sanjay Joshi',
      emergencyContactRelationship: 'Father',
      emergencyContactMobile: '9820199110',
      doctors: [doctor2.id],
    },
    {
      patientNumber: 'P-1006',
      fullName: 'Amitabh Roy',
      gender: 'MALE',
      age: 63,
      mobile: '9820199111',
      email: 'amitabh.r@example.com',
      bloodGroup: 'B-',
      allergies: 'Ibuprofen',
      existingIllness: 'Coronary Artery Disease',
      medicalConditions: 'Post-PTCA stent placed 2019, regular follow-up',
      emergencyContactName: 'Sharmila Roy',
      emergencyContactRelationship: 'Wife',
      emergencyContactMobile: '9820199112',
      doctors: [doctor1.id],
    },
    {
      patientNumber: 'P-1007',
      fullName: 'Deepak Nair',
      gender: 'MALE',
      age: 39,
      mobile: '9820199113',
      email: 'deepak.n@example.com',
      bloodGroup: 'A-',
      allergies: 'None',
      existingIllness: 'GERD / Acidity',
      medicalConditions: 'Chronic reflux symptoms',
      emergencyContactName: 'Radhika Nair',
      emergencyContactRelationship: 'Sister',
      emergencyContactMobile: '9820199114',
      doctors: [doctor2.id],
    },
    {
      patientNumber: 'P-1008',
      fullName: 'Pooja Hegde',
      gender: 'FEMALE',
      age: 31,
      mobile: '9820199115',
      email: 'pooja.h@example.com',
      bloodGroup: 'O+',
      allergies: 'Latex',
      existingIllness: 'Iron Deficiency Anemia',
      medicalConditions: 'Hemoglobin 9.8 g/dL',
      emergencyContactName: 'Suresh Hegde',
      emergencyContactRelationship: 'Brother',
      emergencyContactMobile: '9820199116',
      doctors: [doctor2.id],
    },
    {
      patientNumber: 'P-1009',
      fullName: 'Vikrant Gujral',
      gender: 'MALE',
      age: 49,
      mobile: '9820199117',
      email: 'vikrant.g@example.com',
      bloodGroup: 'AB-',
      allergies: 'Codeine',
      existingIllness: 'Lumbar Spondylosis',
      medicalConditions: 'Lower back stiffness',
      emergencyContactName: 'Anita Gujral',
      emergencyContactRelationship: 'Wife',
      emergencyContactMobile: '9820199118',
      doctors: [doctor1.id],
    },
    {
      patientNumber: 'P-1010',
      fullName: 'Ritu Singhania',
      gender: 'FEMALE',
      age: 22,
      mobile: '9820199119',
      email: 'ritu.s@example.com',
      bloodGroup: 'B+',
      allergies: 'None',
      existingIllness: 'Acute Viral Pharyngitis',
      medicalConditions: 'Fever and sore throat since 2 days',
      emergencyContactName: 'Alok Singhania',
      emergencyContactRelationship: 'Father',
      emergencyContactMobile: '9820199120',
      doctors: [doctor2.id],
    },
  ];

  const createdPatients = [];
  for (const p of patientsData) {
    const patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        patientNumber: p.patientNumber,
        fullName: p.fullName,
        age: p.age,
        gender: p.gender as any,
        mobile: p.mobile,
        email: p.email,
        bloodGroup: p.bloodGroup,
        allergies: p.allergies,
        existingIllness: p.existingIllness,
        medicalConditions: p.medicalConditions,
        emergencyContactName: p.emergencyContactName,
        emergencyContactRelationship: p.emergencyContactRelationship,
        emergencyContactMobile: p.emergencyContactMobile,
        address: 'Bandra West, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      },
    });

    // Assign doctors
    for (const docId of p.doctors) {
      await prisma.patientDoctor.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          doctorId: docId,
          assignedBy: 'System Seed',
        },
      });
    }

    createdPatients.push(patient);
  }
  console.log(`✅ Seeded ${createdPatients.length} patients with doctor assignments`);

  // 7. Seed Appointments for Today & Tomorrow (Active Queue)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Appt 1: Completed consultation with Dr. Raj Sharma
  const appt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: createdPatients[0].id, // Rahul Verma
      doctorId: doctor1.id,
      appointmentDate: today,
      appointmentTime: '09:30 AM',
      appointmentType: 'FOLLOW_UP',
      tokenNumber: 1,
      status: 'COMPLETED',
      consultationFee: 700.0,
      notes: 'Blood pressure check follow-up',
    },
  });

  const consult1 = await prisma.consultation.create({
    data: {
      clinicId: clinic.id,
      appointmentId: appt1.id,
      patientId: createdPatients[0].id,
      doctorId: doctor1.id,
      chiefComplaint: 'Routine follow-up for blood pressure monitoring. No chest pain or shortness of breath.',
      symptoms: 'Occasional mild morning headache, fatigue after long work hours.',
      diagnosis: 'Essential Hypertension - Moderately Controlled (BP 132/84 mmHg)',
      doctorNotes: 'Heart sounds normal, S1/S2 heard clearly. Lungs clear to auscultation bilaterally. Patient is compliant with morning medication.',
      advice: 'Maintain low-sodium diet (less than 3g/day). 30 minutes brisk walking 5 days a week. Keep daily home BP log.',
      testsRecommended: 'Lipid Profile, Serum Creatinine, Electrolytes in 3 months',
      nextVisitDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  const rx1 = await prisma.prescription.create({
    data: {
      clinicId: clinic.id,
      consultationId: consult1.id,
      patientId: createdPatients[0].id,
      doctorId: doctor1.id,
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: rx1.id,
        medicineName: 'Telmisartan 40mg (Telma 40)',
        dosage: '40 mg',
        frequency: '1-0-0',
        duration: '30 days',
        instructions: 'Take 1 tablet every morning after breakfast',
      },
      {
        prescriptionId: rx1.id,
        medicineName: 'Amlodipine 5mg (Amlong 5)',
        dosage: '5 mg',
        frequency: '0-0-1',
        duration: '30 days',
        instructions: 'Take 1 tablet at night before bedtime',
      },
    ],
  });

  await prisma.payment.create({
    data: {
      clinicId: clinic.id,
      patientId: createdPatients[0].id,
      appointmentId: appt1.id,
      doctorId: doctor1.id,
      consultationFee: 700.0,
      additionalFee: 0.0,
      discount: 0.0,
      totalAmount: 700.0,
      paidAmount: 700.0,
      pendingAmount: 0.0,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      transactionReference: 'UPI-REF-90218312',
    },
  });

  // Appt 2: IN_CONSULTATION with Dr. Raj Sharma
  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: createdPatients[2].id, // Aarav Mehta
      doctorId: doctor1.id,
      appointmentDate: today,
      appointmentTime: '10:15 AM',
      appointmentType: 'NEW_PATIENT',
      tokenNumber: 2,
      status: 'IN_CONSULTATION',
      consultationFee: 700.0,
      notes: 'Palpitations after workout',
    },
  });

  // Appt 3: WAITING with Dr. Raj Sharma
  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: createdPatients[3].id, // Sunita Kapoor
      doctorId: doctor1.id,
      appointmentDate: today,
      appointmentTime: '10:45 AM',
      appointmentType: 'FOLLOW_UP',
      tokenNumber: 3,
      status: 'WAITING',
      consultationFee: 700.0,
      notes: 'Checked in at desk at 10:10 AM',
    },
  });

  // Appt 4: WAITING with Dr. Raj Sharma (Walk-In)
  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: createdPatients[5].id, // Amitabh Roy
      doctorId: doctor1.id,
      appointmentDate: today,
      appointmentTime: '11:15 AM',
      appointmentType: 'WALK_IN',
      tokenNumber: 4,
      status: 'WAITING',
      consultationFee: 700.0,
      notes: 'Emergency walk-in chest tightness',
    },
  });

  // Appt 5: Dr. Priya Patel - WAITING (Token 1)
  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: createdPatients[1].id, // Meera Deshmukh
      doctorId: doctor2.id,
      appointmentDate: today,
      appointmentTime: '10:00 AM',
      appointmentType: 'FOLLOW_UP',
      tokenNumber: 1,
      status: 'WAITING',
      consultationFee: 500.0,
      notes: 'Thyroid report evaluation',
    },
  });

  // Appt 6: Dr. Priya Patel - CHECKED_IN (Token 2)
  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: createdPatients[4].id, // Kavita Joshi
      doctorId: doctor2.id,
      appointmentDate: today,
      appointmentTime: '10:30 AM',
      appointmentType: 'NEW_PATIENT',
      tokenNumber: 2,
      status: 'CHECKED_IN',
      consultationFee: 500.0,
      notes: 'Migraine complaints',
    },
  });

  console.log('✅ Seeded live appointments, active queue tokens, consultations & prescriptions');
  console.log('\n🎉 Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
