# MediNovel — REST API Reference Specification

All API endpoints follow standardized JSON responses:

### Success Response Format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

### Error Response Format:
```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient with ID P-1002 not found"
  }
}
```

---

## 1. Authentication (`/api/auth`)
- `POST /api/auth/login` - Public. Body: `{ email, password }`. Returns access token & user profile.
- `POST /api/auth/refresh` - Public / Cookie. Body: `{ refreshToken }`. Issues new access token.
- `POST /api/auth/logout` - Protected. Invalidates session.
- `GET /api/auth/me` - Protected. Returns currently authenticated user, active clinic, doctor/receptionist profile, and permissions.
- `POST /api/auth/change-password` - Protected. Body: `{ currentPassword, newPassword }`.

---

## 2. Super Admin (`/api/super-admin`)
*Requires `SUPER_ADMIN` role.*
- `GET /api/super-admin/dashboard` - Platform statistics (total clinics, active, trial, expired, doctors, receptionists, MRR, growth data).
- `GET /api/super-admin/clinics` - Paginated & filterable list of clinics. Query: `page, limit, search, status`.
- `POST /api/super-admin/clinics` - Provision a new clinic & assign initial clinic admin / doctor.
- `GET /api/super-admin/clinics/:id` - Full clinic profile, subscription status, staff count.
- `PATCH /api/super-admin/clinics/:id` - Update clinic settings.
- `PATCH /api/super-admin/clinics/:id/status` - Toggle status (`ACTIVE`, `SUSPENDED`).
- `GET /api/super-admin/plans` - List subscription plans.
- `POST /api/super-admin/plans` - Create / update subscription tier.

---

## 3. Clinics & Staff Management (`/api/clinics`, `/api/doctors`, `/api/receptionists`)
*Requires clinic membership.*
- `GET /api/clinics/profile` - Returns tenant clinic details.
- `PATCH /api/clinics/profile` - Update clinic details (Name, address, phone, logo, letterhead settings).
- `GET /api/doctors` - List doctors for current clinic.
- `POST /api/doctors` - Add doctor to clinic. Body: `{ name, email, password, mobile, specialization, qualification, registrationNumber, consultationFee, workingDays, workingHours }`.
- `PATCH /api/doctors/:id` - Update doctor information/fees.
- `GET /api/receptionists` - List receptionists for current clinic.
- `POST /api/receptionists` - Add receptionist to clinic. Body: `{ name, email, password, mobile }`.
- `PATCH /api/receptionists/:id` - Update receptionist information.

---

## 4. Patients (`/api/patients`)
*Tenant isolated. Accessible by `DOCTOR`, `RECEPTIONIST`.*
- `GET /api/patients` - List patients with pagination, search, and doctor filter.
- `GET /api/patients/check-duplicate` - Query: `mobile, patientNumber, fullName, dateOfBirth`. Returns existing candidates.
- `POST /api/patients` - Register new patient. Automatically assigns doctor(s) if provided.
- `GET /api/patients/:id` - Complete patient profile, vitals, medical history, past appointments, consultations, and invoices.
- `PATCH /api/patients/:id` - Update patient demographics and medical background.
- `POST /api/patients/:id/doctors` - Assign doctor to patient.
- `DELETE /api/patients/:id/doctors/:doctorId` - Unassign doctor from patient.

---

## 5. Appointments & Daily Queue (`/api/appointments`, `/api/queue`)
*Tenant isolated.*
- `GET /api/appointments` - Query: `date, doctorId, status, page, limit`.
- `POST /api/appointments` - Book appointment. Generates token number if scheduled for today.
- `PATCH /api/appointments/:id` - Reschedule / Update appointment details.
- `PATCH /api/appointments/:id/cancel` - Cancel appointment.
- `GET /api/queue` - Live queue for today. Query: `doctorId`. Returns current, next, waiting, and completed patients.
- `POST /api/queue/check-in` - Check in booked appointment or walk-in, allocates token.
- `POST /api/queue/:id/start` - Doctor starts consultation (Status: `IN_CONSULTATION`).
- `POST /api/queue/:id/skip` - Move token to skipped.
- `POST /api/queue/:id/no-show` - Mark as no-show.

---

## 6. Consultations & Prescriptions (`/api/consultations`, `/api/prescriptions`)
*Only authorized `DOCTOR` can create/complete consultations.*
- `GET /api/consultations/:id` - View consultation record.
- `POST /api/consultations` - Create consultation. Body: `{ appointmentId, patientId, chiefComplaint, symptoms, diagnosis, doctorNotes, advice, testsRecommended, nextVisitDate, status }`.
- `PATCH /api/consultations/:id` - Update draft consultation or mark complete.
- `GET /api/prescriptions/:id` - View prescription details.
- `POST /api/prescriptions` - Create prescription with multiple medication items: `[{ medicineName, dosage, frequency, duration, instructions }]`.

---

## 7. Billing & Payments (`/api/payments`)
*Tenant isolated.*
- `GET /api/payments` - List payments with search, date filter, status filter (`PAID`, `PENDING`).
- `POST /api/payments` - Record payment. Body: `{ patientId, appointmentId, consultationFee, additionalFee, discount, paymentMethod, paymentStatus, transactionReference }`.
- `GET /api/payments/:id/receipt` - Returns structured receipt payload for thermal or PDF printing.

---

## 8. Reports & Analytics (`/api/reports`)
- `GET /api/reports/dashboard-doctor` - Doctor's clinical KPI metrics, today's queue count, revenue summary.
- `GET /api/reports/dashboard-receptionist` - Front-desk queue stats, doctor availability, fee collection.
- `GET /api/reports/financial` - Daily, weekly, monthly revenue breakdown.
- `GET /api/reports/patient-trends` - New vs returning patient analytics.

---

## 9. Subscriptions (`/api/subscriptions`)
- `GET /api/subscriptions/current` - Tenant's current plan, features, limits, and expiry date.
- `PATCH /api/subscriptions/:id` - Plan upgrade / renewal.

---

## 10. System Health (`/api/health`)
- `GET /api/health` - Returns `{ success: true, status: "ok", timestamp: "..." }`.
