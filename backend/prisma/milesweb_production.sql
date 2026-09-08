-- ====================================================================
-- MediNovel Production Database Setup Script for MilesWeb
-- Compatible with MySQL 8.0+ / MariaDB (phpMyAdmin / cPanel / CLI)
-- Generated after latest git pull for MediNovel Multi-Tenant Clinic System
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `refreshTokenHash` TEXT NULL,
    `passwordResetTokenHash` VARCHAR(191) NULL,
    `passwordResetExpiresAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinics` (
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
    `status` ENUM('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clinics_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinic_users` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST') NOT NULL,
    `isOwner` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clinic_users_clinicId_idx`(`clinicId`),
    INDEX `clinic_users_userId_idx`(`userId`),
    UNIQUE INDEX `clinic_users_clinicId_userId_key`(`clinicId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctors` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `specialization` VARCHAR(191) NOT NULL,
    `qualification` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NOT NULL,
    `consultationFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `workingDays` TEXT NOT NULL,
    `workingHours` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `doctors_userId_key`(`userId`),
    INDEX `doctors_clinicId_idx`(`clinicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receptionists` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `receptionists_userId_key`(`userId`),
    INDEX `receptionists_clinicId_idx`(`clinicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientNumber` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `age` INTEGER NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL DEFAULT 'MALE',
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
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `patients_clinicId_idx`(`clinicId`),
    INDEX `patients_clinicId_mobile_idx`(`clinicId`, `mobile`),
    INDEX `patients_clinicId_fullName_idx`(`clinicId`, `fullName`),
    UNIQUE INDEX `patients_clinicId_patientNumber_key`(`clinicId`, `patientNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_doctors` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',

    INDEX `patient_doctors_clinicId_idx`(`clinicId`),
    INDEX `patient_doctors_patientId_idx`(`patientId`),
    INDEX `patient_doctors_doctorId_idx`(`doctorId`),
    UNIQUE INDEX `patient_doctors_patientId_doctorId_key`(`patientId`, `doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `appointmentDate` DATE NOT NULL,
    `appointmentTime` VARCHAR(191) NULL,
    `appointmentType` ENUM('NEW_PATIENT', 'FOLLOW_UP', 'WALK_IN', 'EMERGENCY') NOT NULL DEFAULT 'NEW_PATIENT',
    `tokenNumber` INTEGER NOT NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'SKIPPED') NOT NULL DEFAULT 'BOOKED',
    `consultationFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `appointments_clinicId_idx`(`clinicId`),
    INDEX `appointments_clinicId_doctorId_appointmentDate_idx`(`clinicId`, `doctorId`, `appointmentDate`),
    INDEX `appointments_patientId_idx`(`patientId`),
    INDEX `appointments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultations` (
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
    `status` ENUM('DRAFT', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `consultations_appointmentId_key`(`appointmentId`),
    INDEX `consultations_clinicId_idx`(`clinicId`),
    INDEX `consultations_patientId_idx`(`patientId`),
    INDEX `consultations_doctorId_idx`(`doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `consultationId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `prescribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `prescriptions_consultationId_key`(`consultationId`),
    INDEX `prescriptions_clinicId_idx`(`clinicId`),
    INDEX `prescriptions_patientId_idx`(`patientId`),
    INDEX `prescriptions_doctorId_idx`(`doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_items` (
    `id` VARCHAR(191) NOT NULL,
    `prescriptionId` VARCHAR(191) NOT NULL,
    `medicineName` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `instructions` VARCHAR(191) NULL,

    INDEX `prescription_items_prescriptionId_idx`(`prescriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `doctorId` VARCHAR(191) NULL,
    `consultationFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `additionalFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pendingAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paymentMethod` ENUM('CASH', 'UPI', 'CARD', 'OTHER') NOT NULL DEFAULT 'CASH',
    `paymentStatus` ENUM('PAID', 'PENDING', 'PARTIALLY_PAID') NOT NULL DEFAULT 'PAID',
    `transactionReference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `payments_clinicId_idx`(`clinicId`),
    INDEX `payments_patientId_idx`(`patientId`),
    INDEX `payments_appointmentId_idx`(`appointmentId`),
    INDEX `payments_paymentStatus_idx`(`paymentStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `billingCycle` ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `maxDoctors` INTEGER NOT NULL DEFAULT 1,
    `maxReceptionists` INTEGER NOT NULL DEFAULT 2,
    `features` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `subscription_plans_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` ENUM('TRIAL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NOT NULL,
    `billingCycle` ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `subscriptions_clinicId_key`(`clinicId`),
    INDEX `subscriptions_clinicId_idx`(`clinicId`),
    INDEX `subscriptions_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_payments` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `paymentStatus` ENUM('PAID', 'PENDING', 'PARTIALLY_PAID') NOT NULL DEFAULT 'PAID',
    `transactionId` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_payments_subscriptionId_idx`(`subscriptionId`),
    INDEX `subscription_payments_clinicId_idx`(`clinicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_clinicId_idx`(`clinicId`),
    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clinic_users` ADD CONSTRAINT `clinic_users_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clinic_users` ADD CONSTRAINT `clinic_users_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctors` ADD CONSTRAINT `doctors_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctors` ADD CONSTRAINT `doctors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receptionists` ADD CONSTRAINT `receptionists_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receptionists` ADD CONSTRAINT `receptionists_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_doctors` ADD CONSTRAINT `patient_doctors_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_doctors` ADD CONSTRAINT `patient_doctors_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_doctors` ADD CONSTRAINT `patient_doctors_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `consultations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- ====================================================================
-- SEED DATA (PLANS, SUPER ADMINS, DEMO CLINIC, DOCTORS, RECEPTIONISTS, PATIENTS)
-- ====================================================================

-- 1. Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `code`, `price`, `billingCycle`, `maxDoctors`, `maxReceptionists`, `features`) VALUES
('plan-starter', 'Starter Solo', 'STARTER', 1999.00, 'MONTHLY', 1, 2, '["1 Doctor","2 Receptionists","Daily Queue","Prescriptions","Basic Reports"]'),
('plan-pro', 'Professional Clinic', 'PROFESSIONAL', 4999.00, 'MONTHLY', 5, 5, '["Up to 5 Doctors","5 Receptionists","Multi-Queue","POS Billing","Advanced Analytics","SMS Alerts"]'),
('plan-enterprise', 'Polyclinic Enterprise', 'CLINIC', 9999.00, 'MONTHLY', 20, 15, '["Unlimited Doctors","Unlimited Staff","Multi-Branch Ready","Custom Rx Letterhead","API Access","Dedicated Support"]')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Super Admin Users
-- Passwords:
-- admin@medinovel.com -> Admin@123
-- superadmin@medinovel.com -> SuperAdmin@123
INSERT INTO `users` (`id`, `email`, `passwordHash`, `role`, `status`) VALUES
('user-super-admin', 'admin@medinovel.com', '$2a$10$Z8GFHZ/CWC8C5zhjJXC5reamyVA1jcI2CccMS22j2zPJKuyjx6VBW', 'SUPER_ADMIN', 'ACTIVE'),
('user-super-admin-2', 'superadmin@medinovel.com', '$2a$10$BYobe0v4eickV3IJTpBqy.tIVO6FRBUCMr1UeoqLzSTsrYEIDb3jK', 'SUPER_ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 3. Demo Clinic: Sharma Healthcare & Polyclinic
INSERT INTO `clinics` (`id`, `name`, `slug`, `logo`, `address`, `phone`, `email`, `city`, `state`, `pincode`, `tokenPrefix`, `status`) VALUES
('clinic-sharma', 'Sharma Healthcare & Polyclinic', 'sharma-clinic', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150', 'Suite 402, Metro Health Plaza, Linking Road', '+91 98201 23456', 'contact@sharmaclinic.com', 'Mumbai', 'Maharashtra', '400050', 'SHC', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Clinic Subscription (Active Pro Plan)
INSERT INTO `subscriptions` (`id`, `clinicId`, `planId`, `status`, `startDate`, `endDate`, `billingCycle`, `amount`) VALUES
('sub-sharma-1', 'clinic-sharma', 'plan-pro', 'ACTIVE', NOW(3), DATE_ADD(NOW(3), INTERVAL 1 YEAR), 'MONTHLY', 4999.00)
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 4. Doctors
-- Doctor 1: Dr. Raj Sharma (Password: Doctor@123)
INSERT INTO `users` (`id`, `email`, `passwordHash`, `role`, `status`) VALUES
('user-dr-raj', 'dr.raj@sharmaclinic.com', '$2a$10$leEGwyfq9zvNcg2oLLJOOuIXDvurrTtBzVGQhFlAMi0YXWX9x.92q', 'DOCTOR', 'ACTIVE')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`) VALUES
('cu-dr-raj', 'clinic-sharma', 'user-dr-raj', 'DOCTOR', 1)
ON DUPLICATE KEY UPDATE `role`=VALUES(`role`);

INSERT INTO `doctors` (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `specialization`, `qualification`, `registrationNumber`, `consultationFee`, `status`, `workingDays`, `workingHours`) VALUES
('doc-raj', 'clinic-sharma', 'user-dr-raj', 'Dr. Raj Sharma', 'dr.raj@sharmaclinic.com', '+91 98200 11223', 'Cardiology & Internal Medicine', 'MBBS, MD (Cardiology), FACC', 'MCI-2012-45892', 700.00, 'ACTIVE', '["MON","TUE","WED","THU","FRI","SAT"]', '{"start":"09:00","end":"17:00"}')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Doctor 2: Dr. Priya Patel (Password: Doctor@123)
INSERT INTO `users` (`id`, `email`, `passwordHash`, `role`, `status`) VALUES
('user-dr-priya', 'dr.priya@sharmaclinic.com', '$2a$10$leEGwyfq9zvNcg2oLLJOOuIXDvurrTtBzVGQhFlAMi0YXWX9x.92q', 'DOCTOR', 'ACTIVE')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`) VALUES
('cu-dr-priya', 'clinic-sharma', 'user-dr-priya', 'DOCTOR', 0)
ON DUPLICATE KEY UPDATE `role`=VALUES(`role`);

INSERT INTO `doctors` (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `specialization`, `qualification`, `registrationNumber`, `consultationFee`, `status`, `workingDays`, `workingHours`) VALUES
('doc-priya', 'clinic-sharma', 'user-dr-priya', 'Dr. Priya Patel', 'dr.priya@sharmaclinic.com', '+91 98200 44556', 'Consultant Physician & Diabetologist', 'MBBS, DNB (Family Medicine)', 'MCI-2016-89123', 500.00, 'ACTIVE', '["MON","TUE","WED","THU","FRI"]', '{"start":"10:00","end":"18:00"}')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 5. Receptionists (Password: Reception@123)
INSERT INTO `users` (`id`, `email`, `passwordHash`, `role`, `status`) VALUES
('user-rec-anjali', 'reception@sharmaclinic.com', '$2a$10$yOo9vZAULK6DJKZSKE8BZ.5JE3YaNSWAgjnWV723t8nO5XV//.cdu', 'RECEPTIONIST', 'ACTIVE'),
('user-rec-vikram', 'vikram@sharmaclinic.com', '$2a$10$yOo9vZAULK6DJKZSKE8BZ.5JE3YaNSWAgjnWV723t8nO5XV//.cdu', 'RECEPTIONIST', 'ACTIVE')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`) VALUES
('cu-rec-anjali', 'clinic-sharma', 'user-rec-anjali', 'RECEPTIONIST', 0),
('cu-rec-vikram', 'clinic-sharma', 'user-rec-vikram', 'RECEPTIONIST', 0)
ON DUPLICATE KEY UPDATE `role`=VALUES(`role`);

INSERT INTO `receptionists` (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `status`) VALUES
('rec-anjali', 'clinic-sharma', 'user-rec-anjali', 'Anjali Verma', 'reception@sharmaclinic.com', '+91 98200 77889', 'ACTIVE'),
('rec-vikram', 'clinic-sharma', 'user-rec-vikram', 'Vikram Singh', 'vikram@sharmaclinic.com', '+91 98200 99001', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 6. Sample Patients
INSERT INTO `patients` (`id`, `clinicId`, `patientNumber`, `fullName`, `gender`, `age`, `mobile`, `email`, `bloodGroup`, `allergies`, `existingIllness`, `medicalConditions`, `emergencyContactName`, `emergencyContactRelationship`, `emergencyContactMobile`, `address`, `city`, `state`, `pincode`) VALUES
('pat-1001', 'clinic-sharma', 'P-1001', 'Rahul Verma', 'MALE', 42, '9820199101', 'rahul.verma@example.com', 'B+', 'Penicillin, Sulfa drugs', 'Hypertension', 'Stage 1 Essential Hypertension diagnosed 2021', 'Sunita Verma (Wife)', 'Spouse', '9820199102', 'Bandra West, Mumbai', 'Mumbai', 'Maharashtra', '400050'),
('pat-1002', 'clinic-sharma', 'P-1002', 'Meera Deshmukh', 'FEMALE', 35, '9820199103', 'meera.d@example.com', 'O+', 'None reported', 'Hypothyroidism', 'Thyroiditis on levothyroxine 50mcg', 'Kishore Deshmukh', 'Husband', '9820199104', 'Bandra West, Mumbai', 'Mumbai', 'Maharashtra', '400050'),
('pat-1003', 'clinic-sharma', 'P-1003', 'Aarav Mehta', 'MALE', 28, '9820199105', 'aarav.m@example.com', 'A+', 'Dust mites', 'Seasonal Bronchitis', 'Mild wheezing on exertion', 'Pooja Mehta', 'Mother', '9820199106', 'Bandra West, Mumbai', 'Mumbai', 'Maharashtra', '400050'),
('pat-1004', 'clinic-sharma', 'P-1004', 'Sunita Kapoor', 'FEMALE', 58, '9820199107', 'sunita.k@example.com', 'AB+', 'Aspirin', 'Type 2 Diabetes, High Cholesterol', 'HbA1c 7.4%, Dyslipidemia', 'Ramesh Kapoor', 'Husband', '9820199108', 'Bandra West, Mumbai', 'Mumbai', 'Maharashtra', '400050'),
('pat-1005', 'clinic-sharma', 'P-1005', 'Kavita Joshi', 'FEMALE', 24, '9820199109', 'kavita.j@example.com', 'O-', 'Peanuts', 'Migraine', 'Frequent episodic tension headache', 'Sanjay Joshi', 'Father', '9820199110', 'Bandra West, Mumbai', 'Mumbai', 'Maharashtra', '400050')
ON DUPLICATE KEY UPDATE `fullName`=VALUES(`fullName`);

-- 7. Patient-Doctor Assignments
INSERT INTO `patient_doctors` (`id`, `clinicId`, `patientId`, `doctorId`, `assignedBy`) VALUES
('pd-1', 'clinic-sharma', 'pat-1001', 'doc-raj', 'System Seed'),
('pd-2', 'clinic-sharma', 'pat-1002', 'doc-priya', 'System Seed'),
('pd-3', 'clinic-sharma', 'pat-1003', 'doc-raj', 'System Seed'),
('pd-4', 'clinic-sharma', 'pat-1004', 'doc-raj', 'System Seed'),
('pd-5', 'clinic-sharma', 'pat-1005', 'doc-priya', 'System Seed')
ON DUPLICATE KEY UPDATE `assignedBy`=VALUES(`assignedBy`);

-- 8. Sample Appointments (Live Queue)
INSERT INTO `appointments` (`id`, `clinicId`, `patientId`, `doctorId`, `appointmentDate`, `appointmentTime`, `appointmentType`, `tokenNumber`, `status`, `consultationFee`, `notes`) VALUES
('appt-1', 'clinic-sharma', 'pat-1001', 'doc-raj', CURDATE(), '09:30 AM', 'FOLLOW_UP', 1, 'COMPLETED', 700.00, 'Blood pressure check follow-up'),
('appt-2', 'clinic-sharma', 'pat-1003', 'doc-raj', CURDATE(), '10:15 AM', 'NEW_PATIENT', 2, 'IN_CONSULTATION', 700.00, 'Palpitations after workout'),
('appt-3', 'clinic-sharma', 'pat-1004', 'doc-raj', CURDATE(), '10:45 AM', 'FOLLOW_UP', 3, 'WAITING', 700.00, 'Checked in at desk at 10:10 AM'),
('appt-4', 'clinic-sharma', 'pat-1002', 'doc-priya', CURDATE(), '10:00 AM', 'FOLLOW_UP', 1, 'WAITING', 500.00, 'Thyroid report evaluation'),
('appt-5', 'clinic-sharma', 'pat-1005', 'doc-priya', CURDATE(), '10:30 AM', 'NEW_PATIENT', 2, 'CHECKED_IN', 500.00, 'Migraine complaints')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 9. Sample Completed Consultation, Prescription & Payment
INSERT INTO `consultations` (`id`, `clinicId`, `appointmentId`, `patientId`, `doctorId`, `chiefComplaint`, `symptoms`, `diagnosis`, `doctorNotes`, `advice`, `testsRecommended`, `nextVisitDate`, `status`) VALUES
('con-1', 'clinic-sharma', 'appt-1', 'pat-1001', 'doc-raj', 'Routine follow-up for blood pressure monitoring. No chest pain or shortness of breath.', 'Occasional mild morning headache, fatigue after long work hours.', 'Essential Hypertension - Moderately Controlled (BP 132/84 mmHg)', 'Heart sounds normal, S1/S2 heard clearly. Patient is compliant with morning medication.', 'Maintain low-sodium diet (less than 3g/day). 30 minutes brisk walking 5 days a week.', 'Lipid Profile, Serum Creatinine in 3 months', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'COMPLETED')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `prescriptions` (`id`, `clinicId`, `consultationId`, `patientId`, `doctorId`) VALUES
('rx-1', 'clinic-sharma', 'con-1', 'pat-1001', 'doc-raj')
ON DUPLICATE KEY UPDATE `doctorId`=VALUES(`doctorId`);

INSERT INTO `prescription_items` (`id`, `prescriptionId`, `medicineName`, `dosage`, `frequency`, `duration`, `instructions`) VALUES
('rxi-1', 'rx-1', 'Telmisartan 40mg (Telma 40)', '40 mg', '1-0-0', '30 days', 'Take 1 tablet every morning after breakfast'),
('rxi-2', 'rx-1', 'Amlodipine 5mg (Amlong 5)', '5 mg', '0-0-1', '30 days', 'Take 1 tablet at night before bedtime')
ON DUPLICATE KEY UPDATE `medicineName`=VALUES(`medicineName`);

INSERT INTO `payments` (`id`, `clinicId`, `patientId`, `appointmentId`, `doctorId`, `consultationFee`, `additionalFee`, `discount`, `totalAmount`, `paidAmount`, `pendingAmount`, `paymentMethod`, `paymentStatus`, `transactionReference`) VALUES
('pay-1', 'clinic-sharma', 'pat-1001', 'appt-1', 'doc-raj', 700.00, 0.00, 0.00, 700.00, 700.00, 0.00, 'UPI', 'PAID', 'UPI-REF-90218312')
ON DUPLICATE KEY UPDATE `paymentStatus`=VALUES(`paymentStatus`);

SET FOREIGN_KEY_CHECKS = 1;
