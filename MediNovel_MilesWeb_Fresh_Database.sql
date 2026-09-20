SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- Safe to rerun: existing tables and rows are preserved.
-- Schema changes to existing tables must be applied through migrations.

-- For local testing, make this database name match backend/.env DATABASE_URL.
-- Change both CREATE DATABASE and USE below if your local schema has another name.
CREATE DATABASE IF NOT EXISTS `yrrxigfu_medinovel.com`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `yrrxigfu_medinovel.com`;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN','DOCTOR','RECEPTIONIST') NOT NULL,
    `status` ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `refreshTokenHash` TEXT NULL,
    `passwordResetTokenHash` VARCHAR(191) NULL,
    `passwordResetExpiresAt` DATETIME(3) NULL,
    `passwordResetAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key` (`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- CLINICS
-- =========================================================

CREATE TABLE IF NOT EXISTS `clinics` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo` TEXT NULL,
    `address` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `pincode` VARCHAR(191) NOT NULL,
    `tokenPrefix` VARCHAR(191) NOT NULL DEFAULT 'TKN',
    `maxDoctors` INT NOT NULL DEFAULT 1,
    `maxReceptionists` INT NOT NULL DEFAULT 2,
    `status` ENUM('ACTIVE','SUSPENDED','TRIAL','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clinics_slug_key` (`slug`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- SUBSCRIPTION PLANS
-- =========================================================

CREATE TABLE IF NOT EXISTS `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `billingCycle` ENUM('MONTHLY','YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `maxDoctors` INT NOT NULL DEFAULT 1,
    `maxReceptionists` INT NOT NULL DEFAULT 2,
    `features` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `subscription_plans_code_key` (`code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- CLINIC USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS `clinic_users` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN','DOCTOR','RECEPTIONIST') NOT NULL,
    `isOwner` BOOLEAN NOT NULL DEFAULT FALSE,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clinic_users_clinicId_idx` (`clinicId`),
    INDEX `clinic_users_userId_idx` (`userId`),
    UNIQUE INDEX `clinic_users_clinicId_userId_key` (`clinicId`,`userId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- DOCTORS
-- =========================================================

CREATE TABLE IF NOT EXISTS `doctors` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `specialization` VARCHAR(191) NOT NULL,
    `qualification` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NOT NULL,
    `consultationFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `workingDays` TEXT NOT NULL,
    `workingHours` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `doctors_userId_key` (`userId`),
    INDEX `doctors_clinicId_idx` (`clinicId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- RECEPTIONISTS
-- =========================================================

CREATE TABLE IF NOT EXISTS `receptionists` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `receptionists_userId_key` (`userId`),
    INDEX `receptionists_clinicId_idx` (`clinicId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- PATIENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS `patients` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientNumber` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `age` INT NULL,
    `gender` ENUM('MALE','FEMALE','OTHER') NOT NULL DEFAULT 'MALE',
    `mobile` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `bloodGroup` VARCHAR(191) NULL,
    `allergies` TEXT NULL,
    `existingIllness` TEXT NULL,
    `medicalConditions` TEXT NULL,
    `emergencyContactName` VARCHAR(191) NULL,
    `emergencyContactRelationship` VARCHAR(191) NULL,
    `emergencyContactMobile` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `patients_clinicId_idx` (`clinicId`),
    INDEX `patients_clinicId_mobile_idx` (`clinicId`,`mobile`),
    INDEX `patients_clinicId_fullName_idx` (`clinicId`,`fullName`),
    UNIQUE INDEX `patients_clinicId_patientNumber_key`
        (`clinicId`,`patientNumber`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- PATIENT DOCTORS
-- =========================================================

CREATE TABLE IF NOT EXISTS `patient_doctors` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',

    INDEX `patient_doctors_clinicId_idx` (`clinicId`),
    INDEX `patient_doctors_patientId_idx` (`patientId`),
    INDEX `patient_doctors_doctorId_idx` (`doctorId`),
    UNIQUE INDEX `patient_doctors_patientId_doctorId_key`
        (`patientId`,`doctorId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- APPOINTMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `appointmentDate` DATE NOT NULL,
    `appointmentTime` VARCHAR(191) NULL,
    `appointmentType` ENUM(
        'NEW_PATIENT',
        'FOLLOW_UP',
        'WALK_IN',
        'EMERGENCY'
    ) NOT NULL DEFAULT 'NEW_PATIENT',
    `tokenNumber` INT NOT NULL,
    `status` ENUM(
        'PENDING_CONFIRMATION',
        'BOOKED',
        'CHECKED_IN',
        'WAITING',
        'READY_FOR_DOCTOR',
        'IN_CONSULTATION',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'SKIPPED'
    ) NOT NULL DEFAULT 'BOOKED',
    `consultationFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `reasonForVisit` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `appointments_clinicId_idx` (`clinicId`),
    INDEX `appointments_clinicId_doctorId_appointmentDate_idx`
        (`clinicId`,`doctorId`,`appointmentDate`),
    INDEX `appointments_patientId_idx` (`patientId`),
    INDEX `appointments_status_idx` (`status`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- CONSULTATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS `consultations` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `chiefComplaint` TEXT NOT NULL,
    `symptoms` TEXT NULL,
    `diagnosis` TEXT NOT NULL,
    `doctorNotes` TEXT NULL,
    `advice` TEXT NULL,
    `testsRecommended` TEXT NULL,
    `nextVisitDate` DATE NULL,
    `followUpNotes` TEXT NULL,
    `status` ENUM('DRAFT','COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `consultations_appointmentId_key` (`appointmentId`),
    INDEX `consultations_clinicId_idx` (`clinicId`),
    INDEX `consultations_patientId_idx` (`patientId`),
    INDEX `consultations_doctorId_idx` (`doctorId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- PRESCRIPTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS `prescriptions` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `consultationId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `prescribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `prescriptions_consultationId_key` (`consultationId`),
    INDEX `prescriptions_clinicId_idx` (`clinicId`),
    INDEX `prescriptions_patientId_idx` (`patientId`),
    INDEX `prescriptions_doctorId_idx` (`doctorId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- PRESCRIPTION ITEMS
-- =========================================================

CREATE TABLE IF NOT EXISTS `prescription_items` (
    `id` VARCHAR(191) NOT NULL,
    `prescriptionId` VARCHAR(191) NOT NULL,
    `medicineName` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `instructions` VARCHAR(191) NULL,

    INDEX `prescription_items_prescriptionId_idx`
        (`prescriptionId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- PAYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS `payments` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `doctorId` VARCHAR(191) NULL,
    `consultationFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `additionalFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    -- paidAmount may exceed totalAmount; the difference is excess received.
    -- pendingAmount remains zero once the invoice is fully covered.
    `paidAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `pendingAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `paymentMethod` ENUM('CASH','UPI','CARD','OTHER') NOT NULL DEFAULT 'CASH',
    `paymentStatus` ENUM('PAID','PENDING','PARTIALLY_PAID') NOT NULL DEFAULT 'PAID',
    `transactionReference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `payments_clinicId_idx` (`clinicId`),
    INDEX `payments_patientId_idx` (`patientId`),
    INDEX `payments_appointmentId_idx` (`appointmentId`),
    INDEX `payments_paymentStatus_idx` (`paymentStatus`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- PAYMENT RECEIPTS
-- =========================================================

-- Payment collections are separate from invoices so a fee collected today
-- remains in today's dashboard even if its invoice was created earlier.
CREATE TABLE IF NOT EXISTS `payment_receipts` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_receipts_clinicId_createdAt_idx` (`clinicId`,`createdAt`),
    INDEX `payment_receipts_doctorId_createdAt_idx` (`doctorId`,`createdAt`),
    INDEX `payment_receipts_paymentId_idx` (`paymentId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- ADMISSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS `admissions` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `attendingDoctorId` VARCHAR(191) NULL,
    `admissionNumber` VARCHAR(191) NOT NULL,
    `admittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dischargedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ADMITTED',
    `roomNumber` VARCHAR(191) NULL,
    `bedNumber` VARCHAR(191) NULL,
    `reason` TEXT NOT NULL,
    `diagnosis` TEXT NULL,
    `notes` TEXT NULL,
    `dischargeSummary` TEXT NULL,
    `totalAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `paidAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `pendingAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admissions_clinicId_admissionNumber_key`
        (`clinicId`,`admissionNumber`),
    INDEX `admissions_clinicId_status_idx`
        (`clinicId`,`status`),
    INDEX `admissions_patientId_idx` (`patientId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- ADMISSION PAYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS `admission_payments` (
    `id` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'CASH',
    `transactionReference` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admission_payments_admissionId_createdAt_idx`
        (`admissionId`, `createdAt`),
    INDEX `admission_payments_createdAt_idx`
        (`createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` ENUM(
        'TRIAL',
        'ACTIVE',
        'EXPIRING_SOON',
        'EXPIRED',
        'CANCELLED',
        'SUSPENDED'
    ) NOT NULL DEFAULT 'ACTIVE',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NOT NULL,
    `billingCycle` ENUM('MONTHLY','YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `amount` DECIMAL(10,2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `subscriptions_clinicId_key` (`clinicId`),
    INDEX `subscriptions_clinicId_idx` (`clinicId`),
    INDEX `subscriptions_planId_idx` (`planId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- SUBSCRIPTION PAYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS `subscription_payments` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `paymentStatus` ENUM('PAID','PENDING','PARTIALLY_PAID') NOT NULL DEFAULT 'PAID',
    `transactionId` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_payments_subscriptionId_idx`
        (`subscriptionId`),
    INDEX `subscription_payments_clinicId_idx`
        (`clinicId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_clinicId_idx` (`clinicId`),
    INDEX `audit_logs_userId_idx` (`userId`),
    INDEX `audit_logs_createdAt_idx` (`createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- CONTACT INQUIRIES
-- =========================================================

CREATE TABLE IF NOT EXISTS `inquiries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `clinicType` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `inquiries_createdAt_idx` (`createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- FOREIGN KEYS
-- =========================================================

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_users' AND CONSTRAINT_NAME = 'clinic_users_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `clinic_users` ADD CONSTRAINT `clinic_users_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_users' AND CONSTRAINT_NAME = 'clinic_users_userId_fkey'), 'SELECT 1', 'ALTER TABLE `clinic_users` ADD CONSTRAINT `clinic_users_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND CONSTRAINT_NAME = 'doctors_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `doctors` ADD CONSTRAINT `doctors_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND CONSTRAINT_NAME = 'doctors_userId_fkey'), 'SELECT 1', 'ALTER TABLE `doctors` ADD CONSTRAINT `doctors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'receptionists' AND CONSTRAINT_NAME = 'receptionists_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `receptionists` ADD CONSTRAINT `receptionists_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'receptionists' AND CONSTRAINT_NAME = 'receptionists_userId_fkey'), 'SELECT 1', 'ALTER TABLE `receptionists` ADD CONSTRAINT `receptionists_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'patients' AND CONSTRAINT_NAME = 'patients_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `patients` ADD CONSTRAINT `patients_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_doctors' AND CONSTRAINT_NAME = 'patient_doctors_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `patient_doctors` ADD CONSTRAINT `patient_doctors_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_doctors' AND CONSTRAINT_NAME = 'patient_doctors_patientId_fkey'), 'SELECT 1', 'ALTER TABLE `patient_doctors` ADD CONSTRAINT `patient_doctors_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_doctors' AND CONSTRAINT_NAME = 'patient_doctors_doctorId_fkey'), 'SELECT 1', 'ALTER TABLE `patient_doctors` ADD CONSTRAINT `patient_doctors_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND CONSTRAINT_NAME = 'appointments_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `appointments` ADD CONSTRAINT `appointments_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND CONSTRAINT_NAME = 'appointments_patientId_fkey'), 'SELECT 1', 'ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND CONSTRAINT_NAME = 'appointments_doctorId_fkey'), 'SELECT 1', 'ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND CONSTRAINT_NAME = 'consultations_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `consultations` ADD CONSTRAINT `consultations_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND CONSTRAINT_NAME = 'consultations_appointmentId_fkey'), 'SELECT 1', 'ALTER TABLE `consultations` ADD CONSTRAINT `consultations_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND CONSTRAINT_NAME = 'consultations_patientId_fkey'), 'SELECT 1', 'ALTER TABLE `consultations` ADD CONSTRAINT `consultations_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND CONSTRAINT_NAME = 'consultations_doctorId_fkey'), 'SELECT 1', 'ALTER TABLE `consultations` ADD CONSTRAINT `consultations_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND CONSTRAINT_NAME = 'prescriptions_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND CONSTRAINT_NAME = 'prescriptions_consultationId_fkey'), 'SELECT 1', 'ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `consultations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND CONSTRAINT_NAME = 'prescriptions_patientId_fkey'), 'SELECT 1', 'ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND CONSTRAINT_NAME = 'prescriptions_doctorId_fkey'), 'SELECT 1', 'ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'prescription_items' AND CONSTRAINT_NAME = 'prescription_items_prescriptionId_fkey'), 'SELECT 1', 'ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'payments_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `payments` ADD CONSTRAINT `payments_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'payments_patientId_fkey'), 'SELECT 1', 'ALTER TABLE `payments` ADD CONSTRAINT `payments_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'payments_appointmentId_fkey'), 'SELECT 1', 'ALTER TABLE `payments` ADD CONSTRAINT `payments_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND CONSTRAINT_NAME = 'payments_doctorId_fkey'), 'SELECT 1', 'ALTER TABLE `payments` ADD CONSTRAINT `payments_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_receipts' AND CONSTRAINT_NAME = 'payment_receipts_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `payment_receipts` ADD CONSTRAINT `payment_receipts_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_receipts' AND CONSTRAINT_NAME = 'payment_receipts_paymentId_fkey'), 'SELECT 1', 'ALTER TABLE `payment_receipts` ADD CONSTRAINT `payment_receipts_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_receipts' AND CONSTRAINT_NAME = 'payment_receipts_doctorId_fkey'), 'SELECT 1', 'ALTER TABLE `payment_receipts` ADD CONSTRAINT `payment_receipts_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'admissions' AND CONSTRAINT_NAME = 'admissions_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `admissions` ADD CONSTRAINT `admissions_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'admissions' AND CONSTRAINT_NAME = 'admissions_patientId_fkey'), 'SELECT 1', 'ALTER TABLE `admissions` ADD CONSTRAINT `admissions_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'admissions' AND CONSTRAINT_NAME = 'admissions_attendingDoctorId_fkey'), 'SELECT 1', 'ALTER TABLE `admissions` ADD CONSTRAINT `admissions_attendingDoctorId_fkey` FOREIGN KEY (`attendingDoctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'admission_payments' AND CONSTRAINT_NAME = 'admission_payments_admissionId_fkey'), 'SELECT 1', 'ALTER TABLE `admission_payments` ADD CONSTRAINT `admission_payments_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `admissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions' AND CONSTRAINT_NAME = 'subscriptions_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions' AND CONSTRAINT_NAME = 'subscriptions_planId_fkey'), 'SELECT 1', 'ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'subscription_payments' AND CONSTRAINT_NAME = 'subscription_payments_subscriptionId_fkey'), 'SELECT 1', 'ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND CONSTRAINT_NAME = 'audit_logs_clinicId_fkey'), 'SELECT 1', 'ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND CONSTRAINT_NAME = 'audit_logs_userId_fkey'), 'SELECT 1', 'ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

-- Add the password reset attempt counter to older installations without touching rows.
SET @schema_sql = IF(EXISTS (SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'passwordResetAttempts'),
    'SELECT 1',
    'ALTER TABLE `users` ADD COLUMN `passwordResetAttempts` INTEGER NOT NULL DEFAULT 0');
PREPARE schema_stmt FROM @schema_sql;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;

SELECT 'MediNovel database schema checked; existing data preserved.' AS `result`;
