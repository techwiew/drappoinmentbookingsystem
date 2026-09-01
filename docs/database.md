# ClinicFlow — Database Architecture & Schema Specification

## 1. ORM & Database Engine
- **Engine**: MySQL 8.0+ / MariaDB 10.5+
- **ORM**: Prisma 5.x
- **Data Types**: Strict `Decimal(10,2)` for all financial and monetary values. ISO-8601 UTC for timestamps.

---

## 2. Table Specifications

### 2.1 `users`
Global authentication table for all platform users.
- `id`: `String` (UUID / CUID, Primary Key)
- `email`: `String` (Unique, indexed)
- `passwordHash`: `String`
- `role`: `Enum(SUPER_ADMIN, DOCTOR, RECEPTIONIST)`
- `status`: `Enum(ACTIVE, INACTIVE, SUSPENDED)`
- `refreshTokenHash`: `String?`
- `lastLoginAt`: `DateTime?`
- `createdAt`, `updatedAt`: `DateTime`

### 2.2 `clinics`
Tenant root account.
- `id`: `String` (Primary Key)
- `name`: `String`
- `slug`: `String` (Unique)
- `logo`: `String?`
- `address`: `String`
- `phone`: `String`
- `email`: `String`
- `city`: `String`
- `state`: `String`
- `pincode`: `String`
- `tokenPrefix`: `String` (Default: "TKN")
- `status`: `Enum(ACTIVE, SUSPENDED, TRIAL, EXPIRED)`
- `createdAt`, `updatedAt`: `DateTime`

### 2.3 `clinic_users`
Junction connecting users to tenant clinics with role scope.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
- `userId`: `String` (Foreign Key -> `users.id`, Indexed)
- `role`: `Enum(DOCTOR, RECEPTIONIST, CLINIC_ADMIN)`
- `isOwner`: `Boolean` (Default: false)
- `createdAt`: `DateTime`
- **Unique**: `[clinicId, userId]`

### 2.4 `doctors`
Doctor profile details.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
- `userId`: `String` (Foreign Key -> `users.id`, Unique)
- `name`: `String`
- `email`: `String`
- `mobile`: `String`
- `specialization`: `String`
- `qualification`: `String`
- `registrationNumber`: `String`
- `consultationFee`: `Decimal(10,2)` (Default: 0.00)
- `status`: `Enum(ACTIVE, INACTIVE)`
- `workingDays`: `Json` (Array of days e.g. ["MON", "TUE", "WED", "THU", "FRI", "SAT"])
- `workingHours`: `Json` (e.g. { "start": "09:00", "end": "17:00" })
- `createdAt`, `updatedAt`: `DateTime`

### 2.5 `receptionists`
Front-desk staff profile.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
- `userId`: `String` (Foreign Key -> `users.id`, Unique)
- `name`: `String`
- `email`: `String`
- `mobile`: `String`
- `status`: `Enum(ACTIVE, INACTIVE)`
- `createdAt`, `updatedAt`: `DateTime`

### 2.6 `patients`
Tenant-scoped patient master.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
- `patientNumber`: `String` (e.g., "P-1001", Unique per clinic: `[clinicId, patientNumber]`)
- `fullName`: `String`
- `dateOfBirth`: `DateTime?`
- `age`: `Int?`
- `gender`: `Enum(MALE, FEMALE, OTHER)`
- `mobile`: `String` (Indexed per clinic: `[clinicId, mobile]`)
- `email`: `String?`
- `address`: `String?`
- `city`: `String?`
- `state`: `String?`
- `pincode`: `String?`
- `bloodGroup`: `String?`
- `allergies`: `String?`
- `existingIllness`: `String?`
- `medicalConditions`: `String?`
- `emergencyContactName`: `String?`
- `emergencyContactRelationship`: `String?`
- `emergencyContactMobile`: `String?`
- `notes`: `String?`
- `createdAt`, `updatedAt`: `DateTime`

### 2.7 `patient_doctors`
Many-to-Many junction connecting patients to assigned doctors within a clinic.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`)
- `patientId`: `String` (Foreign Key -> `patients.id`, Indexed)
- `doctorId`: `String` (Foreign Key -> `doctors.id`, Indexed)
- `assignedAt`: `DateTime` (Default: now())
- `assignedBy`: `String?`
- `status`: `Enum(ACTIVE, INACTIVE)`
- **Unique**: `[patientId, doctorId]`

### 2.8 `appointments`
Scheduled & walk-in visits.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
- `patientId`: `String` (Foreign Key -> `patients.id`, Indexed)
- `doctorId`: `String` (Foreign Key -> `doctors.id`, Indexed)
- `appointmentDate`: `DateTime` (Indexed: `[clinicId, doctorId, appointmentDate]`)
- `appointmentTime`: `String` (e.g. "10:30 AM")
- `appointmentType`: `Enum(NEW_PATIENT, FOLLOW_UP, WALK_IN, EMERGENCY)`
- `tokenNumber`: `Int`
- `status`: `Enum(BOOKED, CHECKED_IN, WAITING, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW, SKIPPED)`
- `consultationFee`: `Decimal(10,2)`
- `notes`: `String?`
- `createdBy`: `String?`
- `createdAt`, `updatedAt`: `DateTime`

### 2.9 `consultations`
Clinical session diagnosis, notes and examination findings.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
- `appointmentId`: `String` (Foreign Key -> `appointments.id`, Unique)
- `patientId`: `String` (Foreign Key -> `patients.id`, Indexed)
- `doctorId`: `String` (Foreign Key -> `doctors.id`, Indexed)
- `chiefComplaint`: `String`
- `symptoms`: `String?`
- `diagnosis`: `String`
- `doctorNotes`: `String?`
- `advice`: `String?`
- `testsRecommended`: `String?`
- `nextVisitDate`: `DateTime?`
- `followUpNotes`: `String?`
- `status`: `Enum(DRAFT, COMPLETED)`
- `createdAt`, `updatedAt`: `DateTime`

### 2.10 `prescriptions` & `prescription_items`
- **`prescriptions`**:
  - `id`: `String` (Primary Key)
  - `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
  - `consultationId`: `String` (Foreign Key -> `consultations.id`, Unique)
  - `patientId`: `String` (Foreign Key -> `patients.id`, Indexed)
  - `doctorId`: `String` (Foreign Key -> `doctors.id`, Indexed)
  - `prescribedAt`: `DateTime` (Default: now())
- **`prescription_items`**:
  - `id`: `String` (Primary Key)
  - `prescriptionId`: `String` (Foreign Key -> `prescriptions.id`, Indexed)
  - `medicineName`: `String`
  - `dosage`: `String` (e.g. "500 mg")
  - `frequency`: `String` (e.g. "1-0-1", "0-0-1")
  - `duration`: `String` (e.g. "5 days")
  - `instructions`: `String?` (e.g. "After food")

### 2.11 `payments`
Financial transactions and billing receipts.
- `id`: `String` (Primary Key)
- `clinicId`: `String` (Foreign Key -> `clinics.id`, Indexed)
- `patientId`: `String` (Foreign Key -> `patients.id`, Indexed)
- `appointmentId`: `String?` (Foreign Key -> `appointments.id`, Indexed)
- `doctorId`: `String?` (Foreign Key -> `doctors.id`, Indexed)
- `consultationFee`: `Decimal(10,2)` (Default: 0.00)
- `additionalFee`: `Decimal(10,2)` (Default: 0.00)
- `discount`: `Decimal(10,2)` (Default: 0.00)
- `totalAmount`: `Decimal(10,2)` (Default: 0.00)
- `paidAmount`: `Decimal(10,2)` (Default: 0.00)
- `pendingAmount`: `Decimal(10,2)` (Default: 0.00)
- `paymentMethod`: `Enum(CASH, UPI, CARD, OTHER)`
- `paymentStatus`: `Enum(PAID, PENDING, PARTIALLY_PAID)`
- `transactionReference`: `String?`
- `createdAt`, `updatedAt`: `DateTime`

### 2.12 `subscription_plans`, `subscriptions`, `subscription_payments`
- **`subscription_plans`**:
  - `id`: `String` (Primary Key)
  - `name`: `String` (e.g. "Starter", "Professional", "Clinic Enterprise")
  - `code`: `String` (Unique)
  - `price`: `Decimal(10,2)`
  - `billingCycle`: `Enum(MONTHLY, YEARLY)`
  - `maxDoctors`: `Int`
  - `maxReceptionists`: `Int`
  - `features`: `Json`
- **`subscriptions`**:
  - `id`: `String` (Primary Key)
  - `clinicId`: `String` (Foreign Key -> `clinics.id`, Unique)
  - `planId`: `String` (Foreign Key -> `subscription_plans.id`)
  - `status`: `Enum(TRIAL, ACTIVE, EXPIRING_SOON, EXPIRED, CANCELLED, SUSPENDED)`
  - `startDate`: `DateTime`
  - `endDate`: `DateTime`
  - `billingCycle`: `Enum(MONTHLY, YEARLY)`
  - `amount`: `Decimal(10,2)`
- **`subscription_payments`**:
  - `id`: `String` (Primary Key)
  - `subscriptionId`: `String` (Foreign Key -> `subscriptions.id`)
  - `clinicId`: `String`
  - `amount`: `Decimal(10,2)`
  - `paymentMethod`: `String`
  - `paymentStatus`: `Enum(SUCCESS, FAILED, PENDING)`
  - `transactionId`: `String?`
  - `paidAt`: `DateTime`

### 2.13 `audit_logs`
- `id`: `String` (Primary Key)
- `clinicId`: `String?` (Indexed)
- `userId`: `String?` (Indexed)
- `action`: `String` (e.g. "PATIENT_CREATED", "CONSULTATION_COMPLETED", "PAYMENT_RECORDED")
- `entityType`: `String`
- `entityId`: `String?`
- `metadata`: `Json?`
- `ipAddress`: `String?`
- `createdAt`: `DateTime` (Default: now())
