import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

let superAdminToken = '';
let doctorTokenClinicA = '';
let receptionistTokenClinicA = '';
let doctorTokenClinicB = '';
let clinicAId = '';
let clinicBId = '';
let doctorAId = '';
let patientAId = '';
let appointmentAId = '';

describe('🏥 ClinicFlow Multi-Tenant Full-Stack API Test Suite', () => {
  beforeAll(async () => {
    // 1. Authenticate Super Admin
    const saRes = await request(app).post('/api/auth/login').send({
      email: 'admin@clinicflow.com',
      password: 'Admin@123',
    });
    expect(saRes.status).toBe(200);
    superAdminToken = saRes.body.data.accessToken;

    // 2. Authenticate Doctor from Clinic A (Sharma Clinic)
    const docRes = await request(app).post('/api/auth/login').send({
      email: 'dr.raj@sharmaclinic.com',
      password: 'Doctor@123',
    });
    expect(docRes.status).toBe(200);
    doctorTokenClinicA = docRes.body.data.accessToken;
    clinicAId = docRes.body.data.user.clinic.id;
    doctorAId = docRes.body.data.user.doctor.id;

    // 3. Authenticate Receptionist from Clinic A
    const recRes = await request(app).post('/api/auth/login').send({
      email: 'reception@sharmaclinic.com',
      password: 'Reception@123',
    });
    expect(recRes.status).toBe(200);
    receptionistTokenClinicA = recRes.body.data.accessToken;

    // 4. Create Clinic B via Super Admin
    const plans = await request(app)
      .get('/api/super-admin/plans')
      .set('Authorization', `Bearer ${superAdminToken}`);
    const planId = plans.body.data[0].id;

    const timestamp = Date.now();
    const docBEmail = `dr.vikram.${timestamp}@apollo.com`;

    const clinicBRes = await request(app)
      .post('/api/super-admin/clinics')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Apollo Health Center',
        slug: `apollo-clinic-${timestamp}`,
        address: '45 MG Road',
        phone: '+91 99887 76655',
        email: `contact.apollo.${timestamp}@example.com`,
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        tokenPrefix: 'APO',
        planId,
        adminName: 'Dr. Vikram Apollo',
        adminEmail: docBEmail,
        adminPassword: 'Doctor@123',
        adminMobile: '9988776655',
        specialization: 'Neurology',
        qualification: 'MBBS, DM',
        registrationNumber: 'KMC-9901',
        consultationFee: 800,
      });

    expect(clinicBRes.status).toBe(201);
    clinicBId = clinicBRes.body.data.id;

    // Login as Doctor from Clinic B
    const docBLogin = await request(app).post('/api/auth/login').send({
      email: docBEmail,
      password: 'Doctor@123',
    });
    expect(docBLogin.status).toBe(200);
    doctorTokenClinicB = docBLogin.body.data.accessToken;
  });

  describe('1. Authentication & RBAC Checks', () => {
    it('rejects invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@clinicflow.com',
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns /auth/me for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${doctorTokenClinicA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('DOCTOR');
      expect(res.body.data.clinic.id).toBe(clinicAId);
    });

    it('blocks non-super-admin from /api/super-admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/super-admin/dashboard')
        .set('Authorization', `Bearer ${doctorTokenClinicA}`);
      expect(res.status).toBe(403);
    });

    it('allows super admin to access /api/super-admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/super-admin/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalClinics).toBeGreaterThanOrEqual(2);
    });

    it('rejects doctor creation with invalid mobile number format', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${doctorTokenClinicA}`)
        .send({
          name: 'Invalid Mobile Doctor',
          email: `badmobile.${Date.now()}@example.com`,
          password: 'Doctor@123',
          mobile: '98765',
          specialization: 'Orthopedics',
          qualification: 'MBBS',
          registrationNumber: 'REG-INVALID-1',
          consultationFee: 500,
          workingDays: ['MON', 'TUE', 'WED'],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('2. Patient Registration & Duplicate Detection', () => {
    it('detects duplicate patient by mobile or name', async () => {
      const res = await request(app)
        .get('/api/patients/check-duplicate?mobile=9820199101')
        .set('Authorization', `Bearer ${receptionistTokenClinicA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.matches.length).toBeGreaterThan(0);
      expect(res.body.data.matches[0].fullName).toBe('Rahul Verma');
    });

    it('creates a new patient and assigns doctor', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${receptionistTokenClinicA}`)
        .send({
          fullName: 'Tanvi Saxena',
          mobile: '9820199999',
          gender: 'FEMALE',
          age: 29,
          bloodGroup: 'B+',
          allergies: 'None',
          doctorIds: [doctorAId],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fullName).toBe('Tanvi Saxena');
      expect(res.body.data.assignedDoctors.length).toBe(1);
      patientAId = res.body.data.id;
    });

    it('rejects creation of patient with malformed 10-digit mobile number', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${receptionistTokenClinicA}`)
        .send({
          fullName: 'Bad Mobile Patient',
          mobile: '98765abc10',
          gender: 'MALE',
          age: 33,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Multi-Tenant Strict Data Isolation (Clinic A vs Clinic B)', () => {
    it('PREVENTS Clinic B Doctor from accessing Clinic A Patient', async () => {
      const res = await request(app)
        .get(`/api/patients/${patientAId}`)
        .set('Authorization', `Bearer ${doctorTokenClinicB}`);

      // Must return 404 or 403, NEVER the patient data
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('PREVENTS Clinic B Doctor from listing Clinic A Patients', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${doctorTokenClinicB}`);

      expect(res.status).toBe(200);
      const patientIds = res.body.data.map((p: any) => p.id);
      expect(patientIds).not.toContain(patientAId);
    });
  });

  describe('4. Appointment Booking & Daily Queue State Machine', () => {
    it('books appointment and generates token', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${receptionistTokenClinicA}`)
        .send({
          patientId: patientAId,
          doctorId: doctorAId,
          appointmentDate: todayStr,
          appointmentTime: '11:30 AM',
          appointmentType: 'NEW_PATIENT',
          directCheckIn: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.tokenNumber).toBeGreaterThanOrEqual(1);
      expect(res.body.data.status).toBe('WAITING');
      appointmentAId = res.body.data.id;
    });

    it('fetches live queue and shows patient in waiting list', async () => {
      const res = await request(app)
        .get(`/api/queue?doctorId=${doctorAId}`)
        .set('Authorization', `Bearer ${doctorTokenClinicA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.total).toBeGreaterThanOrEqual(1);
    });

    it('transitions appointment to IN_CONSULTATION when doctor starts consultation', async () => {
      const res = await request(app)
        .post(`/api/queue/${appointmentAId}/start`)
        .set('Authorization', `Bearer ${doctorTokenClinicA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_CONSULTATION');
    });
  });

  describe('5. Clinical Consultation, Prescription & Billing', () => {
    let consultationId = '';

    it('records consultation diagnosis and multi-item prescription', async () => {
      const res = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorTokenClinicA}`)
        .send({
          appointmentId: appointmentAId,
          patientId: patientAId,
          chiefComplaint: 'Severe migraine with aura and nausea',
          symptoms: 'Throbbing unilateral headache, photophobia',
          diagnosis: 'Acute Migraine without complications',
          doctorNotes: 'Fundoscopy normal, vitals stable',
          advice: 'Rest in a dark quiet room, stay hydrated',
          status: 'COMPLETED',
          medicines: [
            {
              medicineName: 'Sumatriptan 50mg',
              dosage: '50 mg',
              frequency: '1-0-0',
              duration: '3 days',
              instructions: 'Take at onset of migraine',
            },
            {
              medicineName: 'Domperidone 10mg',
              dosage: '10 mg',
              frequency: '1-0-1',
              duration: '3 days',
              instructions: 'Take 30 mins before food',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.prescription.items.length).toBe(2);
      consultationId = res.body.data.id;
    });

    it('allows saving consultation without prescription when doctor enters diagnosis and notes', async () => {
      const res = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorTokenClinicA}`)
        .send({
          appointmentId: appointmentAId,
          patientId: patientAId,
          chiefComplaint: 'Follow-up check for recurring headache',
          diagnosis: 'Migraine resolved with no active medication needed',
          doctorNotes: 'Patient improving with hydration and rest',
          status: 'COMPLETED',
          medicines: [],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.prescription).toBeNull();
    });

    it('allows fetching prescription for print formatting', async () => {
      const consult = await request(app)
        .get(`/api/consultations/${consultationId}`)
        .set('Authorization', `Bearer ${doctorTokenClinicA}`);

      const rxId = consult.body.data.prescription.id;
      const res = await request(app)
        .get(`/api/prescriptions/${rxId}`)
        .set('Authorization', `Bearer ${doctorTokenClinicA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.clinic.name).toBe('Sharma Healthcare & Polyclinic');
    });

    it('records payment and calculates decimal balances', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${receptionistTokenClinicA}`)
        .send({
          patientId: patientAId,
          appointmentId: appointmentAId,
          doctorId: doctorAId,
          consultationFee: 700,
          additionalFee: 100,
          discount: 50,
          paidAmount: 750,
          paymentMethod: 'UPI',
          transactionReference: 'UPI-TEST-9921',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.totalAmount).toBe(750);
      expect(res.body.data.paidAmount).toBe(750);
      expect(res.body.data.paymentStatus).toBe('PAID');
    });
  });

  describe('6. Reports and Health Check', () => {
    it('returns doctor dashboard KPIs accurately', async () => {
      const res = await request(app)
        .get(`/api/reports/doctor-dashboard?doctorId=${doctorAId}`)
        .set('Authorization', `Bearer ${doctorTokenClinicA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.totalToday).toBeGreaterThanOrEqual(1);
    });

    it('returns health endpoint 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
