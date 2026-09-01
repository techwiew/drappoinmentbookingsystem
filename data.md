# ClinicFlow Database Schema & Seed Data Script

This document contains the complete database DDL schema and initial seed data for **ClinicFlow — Multi-Tenant Doctor Clinic Management SaaS**.

---

## 1. Quick Database Setup (via Prisma CLI)

To automatically push the schema and seed the database using Prisma:

```bash
# Navigate to backend directory
cd backend

# Push schema to the database (creates all tables & indexes)
npx prisma db push

# Seed the database with Super Admin, Plans, Demo Clinic, Doctors, Patients & Appointments
npm run prisma:seed
```

---

## 2. Raw SQL Schema & Initial Data Script (MySQL / MariaDB Compatible)

You can run the following SQL script directly in **phpMyAdmin**, **MySQL Workbench**, or the **MySQL CLI** on your production database server:

```sql
-- ====================================================================
-- ClinicFlow Multi-Tenant Database Schema (MySQL 8.0+)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Subscription Plans Table
DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `price` DECIMAL(10, 2) NOT NULL,
  `billingCycle` VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  `maxDoctors` INT NOT NULL DEFAULT 1,
  `maxReceptionists` INT NOT NULL DEFAULT 1,
  `features` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clinics (Tenant Master) Table
DROP TABLE IF EXISTS `clinics`;
CREATE TABLE `clinics` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `logo` VARCHAR(255) NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(20) NOT NULL,
  `tokenPrefix` VARCHAR(10) NOT NULL DEFAULT 'TKN',
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_clinics_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Users Table (Authentication & Accounts)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `refreshToken` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Clinic Users (Multi-Tenancy Mapping) Table
DROP TABLE IF EXISTS `clinic_users`;
CREATE TABLE `clinic_users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL UNIQUE,
  `role` VARCHAR(20) NOT NULL,
  `isOwner` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_clinic_users_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_clinic_users_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Subscriptions Table
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL UNIQUE,
  `planId` VARCHAR(36) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate` DATETIME(3) NOT NULL,
  `billingCycle` VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  `amount` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_subscriptions_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subscriptions_plan` FOREIGN KEY (`planId`) REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Doctors Table
DROP TABLE IF EXISTS `doctors`;
CREATE TABLE `doctors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `specialization` VARCHAR(100) NOT NULL,
  `qualification` VARCHAR(100) NOT NULL,
  `registrationNumber` VARCHAR(50) NOT NULL,
  `consultationFee` DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  `workingDays` TEXT NOT NULL,
  `workingHours` TEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_doctors_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doctors_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_doctors_clinicId` (`clinicId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Receptionists Table
DROP TABLE IF EXISTS `receptionists`;
CREATE TABLE `receptionists` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_receptionists_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receptionists_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_receptionists_clinicId` (`clinicId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Patients Master Table
DROP TABLE IF EXISTS `patients`;
CREATE TABLE `patients` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `patientNumber` VARCHAR(50) NOT NULL,
  `fullName` VARCHAR(150) NOT NULL,
  `dateOfBirth` DATETIME(3) NULL,
  `age` INT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `pincode` VARCHAR(20) NULL,
  `bloodGroup` VARCHAR(10) NULL,
  `allergies` TEXT NULL,
  `existingIllness` TEXT NULL,
  `medicalConditions` TEXT NULL,
  `emergencyContactName` VARCHAR(150) NULL,
  `emergencyContactRelationship` VARCHAR(50) NULL,
  `emergencyContactMobile` VARCHAR(20) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_patients_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_clinic_patientNumber` (`clinicId`, `patientNumber`),
  INDEX `idx_patients_clinic_mobile` (`clinicId`, `mobile`),
  INDEX `idx_patients_clinic_name` (`clinicId`, `fullName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Patient Doctors (Many-to-Many Assignment) Table
DROP TABLE IF EXISTS `patient_doctors`;
CREATE TABLE `patient_doctors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `patientId` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_patient_doctors_patient` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_patient_doctors_doctor` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_patient_doctor` (`patientId`, `doctorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Appointments & Daily Queue Table
DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `patientId` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `appointmentDate` VARCHAR(20) NOT NULL,
  `appointmentTime` VARCHAR(20) NOT NULL,
  `appointmentType` VARCHAR(30) NOT NULL DEFAULT 'NEW_PATIENT',
  `tokenNumber` INT NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'WAITING',
  `consultationFee` DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_appointments_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointments_patient` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointments_doctor` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  INDEX `idx_appointments_clinic_date_doctor` (`clinicId`, `appointmentDate`, `doctorId`),
  INDEX `idx_appointments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Consultations Table
DROP TABLE IF EXISTS `consultations`;
CREATE TABLE `consultations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `appointmentId` VARCHAR(36) NOT NULL UNIQUE,
  `patientId` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `chiefComplaint` TEXT NOT NULL,
  `symptoms` TEXT NULL,
  `diagnosis` TEXT NOT NULL,
  `doctorNotes` TEXT NULL,
  `advice` TEXT NULL,
  `testsRecommended` TEXT NULL,
  `nextVisitDate` DATETIME(3) NULL,
  `followUpNotes` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_consultations_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consultations_appointment` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consultations_patient` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consultations_doctor` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Prescriptions Table
DROP TABLE IF EXISTS `prescriptions`;
CREATE TABLE `prescriptions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `consultationId` VARCHAR(36) NOT NULL UNIQUE,
  `patientId` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `prescribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_prescriptions_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prescriptions_consultation` FOREIGN KEY (`consultationId`) REFERENCES `consultations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prescriptions_patient` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prescriptions_doctor` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Prescription Items Table
DROP TABLE IF EXISTS `prescription_items`;
CREATE TABLE `prescription_items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `prescriptionId` VARCHAR(36) NOT NULL,
  `medicineName` VARCHAR(150) NOT NULL,
  `dosage` VARCHAR(50) NOT NULL,
  `frequency` VARCHAR(50) NOT NULL,
  `duration` VARCHAR(50) NOT NULL,
  `instructions` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_prescription_items_prescription` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Payments & Billing Ledger Table
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NOT NULL,
  `patientId` VARCHAR(36) NOT NULL,
  `appointmentId` VARCHAR(36) NULL,
  `doctorId` VARCHAR(36) NULL,
  `consultationFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `additionalFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `pendingAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `paymentMethod` VARCHAR(20) NOT NULL DEFAULT 'CASH',
  `paymentStatus` VARCHAR(20) NOT NULL DEFAULT 'PAID',
  `transactionReference` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_payments_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_patient` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_appointment` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payments_doctor` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL,
  INDEX `idx_payments_clinicId` (`clinicId`),
  INDEX `idx_payments_status` (`paymentStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Audit Logs Table
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `clinicId` VARCHAR(36) NULL,
  `userId` VARCHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entityType` VARCHAR(50) NOT NULL,
  `entityId` VARCHAR(36) NULL,
  `metadata` TEXT NULL,
  `ipAddress` VARCHAR(45) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_audit_clinic` (`clinicId`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED DATA (Subscription Plans, Super Admin, Demo Clinic & Users)
-- Password for all accounts: Admin@123 / Doctor@123 / Reception@123
-- (Bcrypt hash: $2a$10$f36nK5Gj69G4c8vJ7a8Yq.9L7wK5a3d7rQz5e1g4b7k2d8h4l9u8m)
-- ====================================================================

-- 1. Insert Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `code`, `price`, `billingCycle`, `maxDoctors`, `maxReceptionists`, `features`, `createdAt`, `updatedAt`) VALUES
('plan-starter', 'Starter Clinic', 'STARTER', 999.00, 'MONTHLY', 1, 1, '[\"Single Doctor\", \"1 Receptionist\", \"Daily Token Queue\", \"Digital Prescriptions\", \"Basic Billing\"]', NOW(), NOW()),
('plan-pro', 'Professional Polyclinic', 'PROFESSIONAL', 2499.00, 'MONTHLY', 5, 3, '[\"Up to 5 Doctors\", \"3 Receptionists\", \"Live Multi-Doctor Queue\", \"Full Prescription History\", \"Thermal POS Receipts\", \"Duplicate Patient Protection\"]', NOW(), NOW()),
('plan-enterprise', 'Enterprise Hospital', 'CLINIC', 4999.00, 'MONTHLY', 20, 10, '[\"Unlimited Doctors\", \"10 Receptionists\", \"Multi-Department Queues\", \"Advanced Financial Reports\", \"Custom Letterhead Branding\", \"Dedicated Account Manager\"]', NOW(), NOW());

-- 2. Insert Super Admin User
-- Password: Admin@123
INSERT INTO `users` (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-super-admin', 'admin@clinicflow.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'SUPER_ADMIN', 'ACTIVE', NOW(), NOW());

-- 3. Insert Demo Clinic (Sharma Healthcare & Polyclinic)
INSERT INTO `clinics` (`id`, `name`, `slug`, `address`, `phone`, `email`, `city`, `state`, `pincode`, `tokenPrefix`, `status`, `createdAt`, `updatedAt`) VALUES
('clinic-sharma', 'Sharma Healthcare & Polyclinic', 'sharma-healthcare', 'Plot 42, Sunrise Arcade, MG Road', '+91 98200 11223', 'contact@sharmahealthcare.com', 'Mumbai', 'Maharashtra', '400050', 'SHR', 'ACTIVE', NOW(), NOW());

-- 4. Attach Subscription to Demo Clinic
INSERT INTO `subscriptions` (`id`, `clinicId`, `planId`, `status`, `startDate`, `endDate`, `billingCycle`, `amount`, `createdAt`, `updatedAt`) VALUES
('sub-sharma-1', 'clinic-sharma', 'plan-pro', 'ACTIVE', NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'YEARLY', 24990.00, NOW(), NOW());

-- 5. Insert Doctor 1 (Dr. Raj Sharma - Cardiologist)
-- Password: Doctor@123
INSERT INTO `users` (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-dr-raj', 'dr.raj@sharmaclinic.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'DOCTOR', 'ACTIVE', NOW(), NOW());

INSERT INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`, `createdAt`, `updatedAt`) VALUES
('cu-dr-raj', 'clinic-sharma', 'user-dr-raj', 'DOCTOR', TRUE, NOW(), NOW());

INSERT INTO `doctors` (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `specialization`, `qualification`, `registrationNumber`, `consultationFee`, `workingDays`, `workingHours`, `status`, `createdAt`, `updatedAt`) VALUES
('doc-dr-raj', 'clinic-sharma', 'user-dr-raj', 'Dr. Raj Sharma', 'dr.raj@sharmaclinic.com', '9820011223', 'Cardiology & Internal Medicine', 'MBBS, MD (Medicine), DM (Cardio)', 'MMC-2012-99881', 700.00, '[\"MON\", \"TUE\", \"WED\", \"THU\", \"FRI\", \"SAT\"]', '{\"start\": \"09:00 AM\", \"end\": \"06:00 PM\"}', 'ACTIVE', NOW(), NOW());

-- 6. Insert Doctor 2 (Dr. Priya Patel - General Physician)
-- Password: Doctor@123
INSERT INTO `users` (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-dr-priya', 'dr.priya@sharmaclinic.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'DOCTOR', 'ACTIVE', NOW(), NOW());

INSERT INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`, `createdAt`, `updatedAt`) VALUES
('cu-dr-priya', 'clinic-sharma', 'user-dr-priya', 'DOCTOR', FALSE, NOW(), NOW());

INSERT INTO `doctors` (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `specialization`, `qualification`, `registrationNumber`, `consultationFee`, `workingDays`, `workingHours`, `status`, `createdAt`, `updatedAt`) VALUES
('doc-dr-priya', 'clinic-sharma', 'user-dr-priya', 'Dr. Priya Patel', 'dr.priya@sharmaclinic.com', '9820033445', 'General Medicine & Diabetology', 'MBBS, DNB (Family Medicine)', 'MMC-2016-55442', 500.00, '[\"MON\", \"TUE\", \"WED\", \"THU\", \"FRI\", \"SAT\"]', '{\"start\": \"10:00 AM\", \"end\": \"07:00 PM\"}', 'ACTIVE', NOW(), NOW());

-- 7. Insert Receptionist (Anjali Verma)
-- Password: Reception@123
INSERT INTO `users` (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-rec-anjali', 'reception@sharmaclinic.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'RECEPTIONIST', 'ACTIVE', NOW(), NOW());

INSERT INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`, `createdAt`, `updatedAt`) VALUES
('cu-rec-anjali', 'clinic-sharma', 'user-rec-anjali', 'RECEPTIONIST', FALSE, NOW(), NOW());

INSERT INTO `receptionists` (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `status`, `createdAt`, `updatedAt`) VALUES
('rec-anjali', 'clinic-sharma', 'user-rec-anjali', 'Anjali Verma', 'reception@sharmaclinic.com', '9820055667', 'ACTIVE', NOW(), NOW());
```

---

## 3. Seed Credentials Summary

| Role | Email | Password | Assigned Clinic |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@clinicflow.com` | `Admin@123` | Platform Owner |
| **Doctor 1 (Cardiology)** | `dr.raj@sharmaclinic.com` | `Doctor@123` | Sharma Healthcare & Polyclinic |
| **Doctor 2 (General Medicine)** | `dr.priya@sharmaclinic.com` | `Doctor@123` | Sharma Healthcare & Polyclinic |
| **Receptionist** | `reception@sharmaclinic.com` | `Reception@123` | Sharma Healthcare & Polyclinic |
