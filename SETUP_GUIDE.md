# ClinicFlow — Complete User & Developer Setup Guide

> **ClinicFlow** is a subscription-based multi-tenant doctor clinic management SaaS built with React 18 + TypeScript (Frontend), Node.js + Express + Prisma (Backend), and SQLite (local) / MySQL (production).

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Step 1 — Clone & Install Dependencies](#step-1--clone--install-dependencies)
4. [Step 2 — Configure Environment Variables](#step-2--configure-environment-variables)
5. [Step 3 — Database Setup (SQLite Local)](#step-3--database-setup-sqlite-local)
6. [Step 4 — Database Setup (MySQL Production)](#step-4--database-setup-mysql-production)
7. [Step 5 — Seed Initial Data](#step-5--seed-initial-data)
8. [Step 6 — Start Backend Server](#step-6--start-backend-server)
9. [Step 7 — Start Frontend Server](#step-7--start-frontend-server)
10. [Step 8 — Start Both Servers Together](#step-8--start-both-servers-together)
11. [Login Credentials](#login-credentials)
12. [Full MySQL Database SQL Script](#full-mysql-database-sql-script)

---

## Prerequisites

Make sure the following tools are installed on your machine:

| Tool | Minimum Version | Download |
| :--- | :--- | :--- |
| **Node.js** | v18.0+ | https://nodejs.org |
| **npm** | v9.0+ | (Bundled with Node.js) |
| **MySQL** | v8.0+ *(for production)* | https://mysql.com |
| **Git** | Any recent version | https://git-scm.com |

> **Note for Local Development**: SQLite is used by default — **no MySQL installation required** for running locally.

---

## Project Structure

```
appoinmentbookingsystem/
├── backend/                  # Node.js + Express + Prisma API server
│   ├── prisma/
│   │   ├── schema.prisma     # SQLite schema (local dev)
│   │   ├── schema.mysql.prisma  # MySQL schema (production)
│   │   └── seed.ts           # Database seeder
│   ├── src/
│   │   ├── modules/          # Auth, Patients, Doctors, Queue, Billing...
│   │   ├── middlewares/      # Auth, RBAC, Tenant isolation
│   │   └── server.ts         # Express app entry point
│   └── .env.example          # Environment variable template
│
├── frontend/                 # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── features/         # Doctor, Reception, Patients, Billing...
│   │   ├── components/       # UI library (Button, Modal, Card...)
│   │   └── routes/           # AppRoutes with role guards
│   └── .env.example
│
├── data.md                   # Raw MySQL DDL schema & seed SQL
├── vercel.json               # Vercel deployment configuration
└── package.json              # Root scripts for running both together
```

---

## Step 1 — Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/techwiew/drappoinmentbookingsystem.git
cd drappoinmentbookingsystem

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

---

## Step 2 — Configure Environment Variables

### Backend `.env`

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Open `backend/.env` and configure:

```env
# ── Database ──────────────────────────────────────────────────
# For LOCAL development with SQLite (no MySQL needed):
DATABASE_URL="file:./dev.db"

# For PRODUCTION with MySQL, replace with:
# DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/clinicflow_db"

# ── JWT Secrets (change these in production!) ─────────────────
JWT_ACCESS_SECRET="clinicflow_access_secret_change_in_production"
JWT_REFRESH_SECRET="clinicflow_refresh_secret_change_in_production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ── Server Config ─────────────────────────────────────────────
PORT=5000
NODE_ENV=development
```

### Frontend `.env`

```bash
cp frontend/.env.example frontend/.env
```

Open `frontend/.env`:

```env
# Backend API URL — points to your Express server
VITE_API_URL=http://localhost:5000/api
```

---

## Step 3 — Database Setup (SQLite Local)

SQLite requires **zero installation** — it runs as a file in the backend directory.

```bash
cd backend

# Push the Prisma schema to create all tables in dev.db
npx prisma db push

# Verify the schema was created (optional — opens Prisma Studio in browser)
npx prisma studio
```

You should see: `The database is already in sync with the Prisma schema.`

---

## Step 4 — Database Setup (MySQL Production)

If deploying to a VPS or cloud MySQL server, follow these steps:

### 4a. Create the Database

Log into your MySQL server and run:

```sql
CREATE DATABASE clinicflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clinicflow_user'@'%' IDENTIFIED BY 'StrongPassword@123';
GRANT ALL PRIVILEGES ON clinicflow_db.* TO 'clinicflow_user'@'%';
FLUSH PRIVILEGES;
```

### 4b. Switch Prisma to MySQL Schema

```bash
# Use the MySQL-specific schema
cp backend/prisma/schema.mysql.prisma backend/prisma/schema.prisma
```

Update `backend/.env`:
```env
DATABASE_URL="mysql://clinicflow_user:StrongPassword@123@your-mysql-host:3306/clinicflow_db"
```

### 4c. Run Migrations

```bash
cd backend
npx prisma migrate deploy
# OR for a fresh push without migrations:
npx prisma db push
```

---

## Step 5 — Seed Initial Data

This creates the Super Admin account, Subscription Plans, Demo Clinic, Doctors, Receptionist, Patients, and sample Appointments.

```bash
cd backend
npm run prisma:seed
```

Expected output:
```
🌱 Starting database seed...
✅ Super Admin created: admin@clinicflow.com
✅ Subscription plans seeded
✅ Demo clinic created with Active Pro Subscription
✅ Doctors seeded: Dr. Raj Sharma & Dr. Priya Patel
✅ Receptionists seeded
✅ Seeded 10 patients with doctor assignments
✅ Seeded live appointments, active queue tokens, consultations & prescriptions
🎉 Seed finished successfully!
```

---

## Step 6 — Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
🏥 ClinicFlow API Server running at http://localhost:5000
📡 Health endpoint: http://localhost:5000/api/health
🌍 Environment: development
```

Verify it's working:
```bash
# Should return: {"success":true,"data":{"status":"ok",...}}
curl http://localhost:5000/api/health
```

---

## Step 7 — Start Frontend Server

Open a **new terminal window** and run:

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.4.21  ready in 493 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and go to: **http://localhost:5173/login**

---

## Step 8 — Start Both Servers Together

From the **root directory**, run both backend and frontend simultaneously:

```bash
# From the project root
npm run dev
```

This uses `concurrently` to start both services in one terminal:

```
[backend]  🏥 ClinicFlow API Server running at http://localhost:5000
[frontend]   ➜  Local:   http://localhost:5173/
```

---

## Login Credentials

Use these pre-seeded accounts to test all user roles:

| Role | Email | Password | Redirect After Login |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin** | `admin@clinicflow.com` | `Admin@123` | `/super-admin` Platform Console |
| 🩺 **Doctor (Cardiology)** | `dr.raj@sharmaclinic.com` | `Doctor@123` | `/doctor-dashboard` |
| 🩺 **Doctor (General)** | `dr.priya@sharmaclinic.com` | `Doctor@123` | `/doctor-dashboard` |
| 🛎️ **Receptionist** | `reception@sharmaclinic.com` | `Reception@123` | `/reception-desk` |

> **Tip**: The Login page has **Quick Demo Buttons** — click any role button to log in instantly without typing credentials.

---

## Full MySQL Database SQL Script

Run this script on your **MySQL production server** (via phpMyAdmin, MySQL Workbench, or CLI) to create all tables from scratch:

```sql
-- ====================================================================
-- ClinicFlow Multi-Tenant Database Schema (MySQL 8.0+)
-- Run this on your MySQL/MariaDB server
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Subscription Plans
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id`                VARCHAR(36)    NOT NULL PRIMARY KEY,
  `name`              VARCHAR(100)   NOT NULL,
  `code`              VARCHAR(50)    NOT NULL UNIQUE,
  `price`             DECIMAL(10,2)  NOT NULL,
  `billingCycle`      VARCHAR(20)    NOT NULL DEFAULT 'MONTHLY',
  `maxDoctors`        INT            NOT NULL DEFAULT 1,
  `maxReceptionists`  INT            NOT NULL DEFAULT 1,
  `features`          TEXT           NOT NULL,
  `createdAt`         DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clinics (Tenant Master)
CREATE TABLE IF NOT EXISTS `clinics` (
  `id`           VARCHAR(36)   NOT NULL PRIMARY KEY,
  `name`         VARCHAR(150)  NOT NULL,
  `slug`         VARCHAR(100)  NOT NULL UNIQUE,
  `logo`         VARCHAR(255)  NULL,
  `address`      TEXT          NOT NULL,
  `phone`        VARCHAR(20)   NOT NULL,
  `email`        VARCHAR(150)  NOT NULL,
  `city`         VARCHAR(100)  NOT NULL,
  `state`        VARCHAR(100)  NOT NULL,
  `pincode`      VARCHAR(20)   NOT NULL,
  `tokenPrefix`  VARCHAR(10)   NOT NULL DEFAULT 'TKN',
  `status`       VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_clinics_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Users (Authentication)
CREATE TABLE IF NOT EXISTS `users` (
  `id`            VARCHAR(36)   NOT NULL PRIMARY KEY,
  `email`         VARCHAR(150)  NOT NULL UNIQUE,
  `password`      VARCHAR(255)  NOT NULL,
  `role`          VARCHAR(20)   NOT NULL,
  `status`        VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  `refreshToken`  TEXT          NULL,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Clinic Users (Tenant Mapping)
CREATE TABLE IF NOT EXISTS `clinic_users` (
  `id`        VARCHAR(36)  NOT NULL PRIMARY KEY,
  `clinicId`  VARCHAR(36)  NOT NULL,
  `userId`    VARCHAR(36)  NOT NULL UNIQUE,
  `role`      VARCHAR(20)  NOT NULL,
  `isOwner`   BOOLEAN      NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_cu_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cu_user`   FOREIGN KEY (`userId`)   REFERENCES `users`(`id`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Subscriptions
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`           VARCHAR(36)    NOT NULL PRIMARY KEY,
  `clinicId`     VARCHAR(36)    NOT NULL UNIQUE,
  `planId`       VARCHAR(36)    NOT NULL,
  `status`       VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
  `startDate`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate`      DATETIME(3)    NOT NULL,
  `billingCycle` VARCHAR(20)    NOT NULL DEFAULT 'MONTHLY',
  `amount`       DECIMAL(10,2)  NOT NULL,
  `createdAt`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_sub_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_plan`   FOREIGN KEY (`planId`)   REFERENCES `subscription_plans`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Doctors
CREATE TABLE IF NOT EXISTS `doctors` (
  `id`                  VARCHAR(36)    NOT NULL PRIMARY KEY,
  `clinicId`            VARCHAR(36)    NOT NULL,
  `userId`              VARCHAR(36)    NOT NULL UNIQUE,
  `name`                VARCHAR(150)   NOT NULL,
  `email`               VARCHAR(150)   NOT NULL,
  `mobile`              VARCHAR(20)    NOT NULL,
  `specialization`      VARCHAR(100)   NOT NULL,
  `qualification`       VARCHAR(100)   NOT NULL,
  `registrationNumber`  VARCHAR(50)    NOT NULL,
  `consultationFee`     DECIMAL(10,2)  NOT NULL DEFAULT 500.00,
  `workingDays`         TEXT           NOT NULL,
  `workingHours`        TEXT           NOT NULL,
  `status`              VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
  `createdAt`           DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_doc_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_user`   FOREIGN KEY (`userId`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  INDEX `idx_doctors_clinicId` (`clinicId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Receptionists
CREATE TABLE IF NOT EXISTS `receptionists` (
  `id`        VARCHAR(36)   NOT NULL PRIMARY KEY,
  `clinicId`  VARCHAR(36)   NOT NULL,
  `userId`    VARCHAR(36)   NOT NULL UNIQUE,
  `name`      VARCHAR(150)  NOT NULL,
  `email`     VARCHAR(150)  NOT NULL,
  `mobile`    VARCHAR(20)   NOT NULL,
  `status`    VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_rec_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rec_user`   FOREIGN KEY (`userId`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  INDEX `idx_receptionists_clinicId` (`clinicId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Patients
CREATE TABLE IF NOT EXISTS `patients` (
  `id`                           VARCHAR(36)   NOT NULL PRIMARY KEY,
  `clinicId`                     VARCHAR(36)   NOT NULL,
  `patientNumber`                VARCHAR(50)   NOT NULL,
  `fullName`                     VARCHAR(150)  NOT NULL,
  `dateOfBirth`                  DATETIME(3)   NULL,
  `age`                          INT           NULL,
  `gender`                       VARCHAR(20)   NOT NULL,
  `mobile`                       VARCHAR(20)   NOT NULL,
  `email`                        VARCHAR(150)  NULL,
  `address`                      TEXT          NULL,
  `city`                         VARCHAR(100)  NULL,
  `bloodGroup`                   VARCHAR(10)   NULL,
  `allergies`                    TEXT          NULL,
  `existingIllness`              TEXT          NULL,
  `emergencyContactName`         VARCHAR(150)  NULL,
  `emergencyContactMobile`       VARCHAR(20)   NULL,
  `notes`                        TEXT          NULL,
  `createdAt`                    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`                    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_pat_clinic` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_clinic_patNum` (`clinicId`, `patientNumber`),
  INDEX `idx_patients_mobile` (`clinicId`, `mobile`),
  INDEX `idx_patients_name`   (`clinicId`, `fullName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Patient-Doctor Assignments (Many-to-Many)
CREATE TABLE IF NOT EXISTS `patient_doctors` (
  `id`         VARCHAR(36)  NOT NULL PRIMARY KEY,
  `patientId`  VARCHAR(36)  NOT NULL,
  `doctorId`   VARCHAR(36)  NOT NULL,
  `assignedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_pd_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pd_doctor`  FOREIGN KEY (`doctorId`)  REFERENCES `doctors`(`id`)  ON DELETE CASCADE,
  UNIQUE KEY `uk_patient_doctor` (`patientId`, `doctorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Appointments & Daily Queue
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`               VARCHAR(36)    NOT NULL PRIMARY KEY,
  `clinicId`         VARCHAR(36)    NOT NULL,
  `patientId`        VARCHAR(36)    NOT NULL,
  `doctorId`         VARCHAR(36)    NOT NULL,
  `appointmentDate`  VARCHAR(20)    NOT NULL,
  `appointmentTime`  VARCHAR(20)    NOT NULL,
  `appointmentType`  VARCHAR(30)    NOT NULL DEFAULT 'NEW_PATIENT',
  `tokenNumber`      INT            NOT NULL,
  `status`           VARCHAR(30)    NOT NULL DEFAULT 'WAITING',
  `consultationFee`  DECIMAL(10,2)  NOT NULL DEFAULT 500.00,
  `notes`            TEXT           NULL,
  `createdAt`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_apt_clinic`  FOREIGN KEY (`clinicId`)  REFERENCES `clinics`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_apt_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_apt_doctor`  FOREIGN KEY (`doctorId`)  REFERENCES `doctors`(`id`)   ON DELETE CASCADE,
  INDEX `idx_apt_date_doctor` (`clinicId`, `appointmentDate`, `doctorId`),
  INDEX `idx_apt_status`      (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Consultations
CREATE TABLE IF NOT EXISTS `consultations` (
  `id`               VARCHAR(36)  NOT NULL PRIMARY KEY,
  `clinicId`         VARCHAR(36)  NOT NULL,
  `appointmentId`    VARCHAR(36)  NOT NULL UNIQUE,
  `patientId`        VARCHAR(36)  NOT NULL,
  `doctorId`         VARCHAR(36)  NOT NULL,
  `chiefComplaint`   TEXT         NOT NULL,
  `symptoms`         TEXT         NULL,
  `diagnosis`        TEXT         NOT NULL,
  `doctorNotes`      TEXT         NULL,
  `advice`           TEXT         NULL,
  `testsRecommended` TEXT         NULL,
  `nextVisitDate`    DATETIME(3)  NULL,
  `followUpNotes`    TEXT         NULL,
  `status`           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `createdAt`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_con_clinic`  FOREIGN KEY (`clinicId`)      REFERENCES `clinics`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_con_apt`     FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_con_patient` FOREIGN KEY (`patientId`)     REFERENCES `patients`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_con_doctor`  FOREIGN KEY (`doctorId`)      REFERENCES `doctors`(`id`)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Prescriptions
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id`              VARCHAR(36)  NOT NULL PRIMARY KEY,
  `clinicId`        VARCHAR(36)  NOT NULL,
  `consultationId`  VARCHAR(36)  NOT NULL UNIQUE,
  `patientId`       VARCHAR(36)  NOT NULL,
  `doctorId`        VARCHAR(36)  NOT NULL,
  `prescribedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_rx_clinic`  FOREIGN KEY (`clinicId`)       REFERENCES `clinics`(`id`)        ON DELETE CASCADE,
  CONSTRAINT `fk_rx_con`     FOREIGN KEY (`consultationId`) REFERENCES `consultations`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_rx_patient` FOREIGN KEY (`patientId`)      REFERENCES `patients`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_rx_doctor`  FOREIGN KEY (`doctorId`)       REFERENCES `doctors`(`id`)        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Prescription Items (Medicine Lines)
CREATE TABLE IF NOT EXISTS `prescription_items` (
  `id`             VARCHAR(36)   NOT NULL PRIMARY KEY,
  `prescriptionId` VARCHAR(36)   NOT NULL,
  `medicineName`   VARCHAR(150)  NOT NULL,
  `dosage`         VARCHAR(50)   NOT NULL,
  `frequency`      VARCHAR(50)   NOT NULL,
  `duration`       VARCHAR(50)   NOT NULL,
  `instructions`   TEXT          NULL,
  `createdAt`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_item_rx` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Payments & Billing Ledger
CREATE TABLE IF NOT EXISTS `payments` (
  `id`                   VARCHAR(36)    NOT NULL PRIMARY KEY,
  `clinicId`             VARCHAR(36)    NOT NULL,
  `patientId`            VARCHAR(36)    NOT NULL,
  `appointmentId`        VARCHAR(36)    NULL,
  `doctorId`             VARCHAR(36)    NULL,
  `consultationFee`      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `additionalFee`        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `discount`             DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `totalAmount`          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `paidAmount`           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `pendingAmount`        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `paymentMethod`        VARCHAR(20)    NOT NULL DEFAULT 'CASH',
  `paymentStatus`        VARCHAR(20)    NOT NULL DEFAULT 'PAID',
  `transactionReference` VARCHAR(100)   NULL,
  `createdAt`            DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`            DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_pay_clinic`  FOREIGN KEY (`clinicId`)      REFERENCES `clinics`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_pay_patient` FOREIGN KEY (`patientId`)     REFERENCES `patients`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_pay_apt`     FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`)  ON DELETE SET NULL,
  CONSTRAINT `fk_pay_doctor`  FOREIGN KEY (`doctorId`)      REFERENCES `doctors`(`id`)       ON DELETE SET NULL,
  INDEX `idx_pay_clinic`  (`clinicId`),
  INDEX `idx_pay_status`  (`paymentStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- INITIAL SEED DATA
-- ====================================================================

-- Subscription Plans
INSERT IGNORE INTO `subscription_plans` (`id`, `name`, `code`, `price`, `billingCycle`, `maxDoctors`, `maxReceptionists`, `features`, `createdAt`, `updatedAt`) VALUES
('plan-starter',    'Starter Clinic',         'STARTER',      999.00,  'MONTHLY', 1,  1,  '["Single Doctor","1 Receptionist","Daily Token Queue","Digital Prescriptions","Basic Billing"]',                                                                                                          NOW(), NOW()),
('plan-pro',        'Professional Polyclinic', 'PROFESSIONAL', 2499.00, 'MONTHLY', 5,  3,  '["Up to 5 Doctors","3 Receptionists","Live Multi-Doctor Queue","Full Prescription History","Thermal POS Receipts","Duplicate Patient Protection"]',                                                       NOW(), NOW()),
('plan-enterprise', 'Enterprise Hospital',     'CLINIC',       4999.00, 'MONTHLY', 20, 10, '["Unlimited Doctors","10 Receptionists","Multi-Department Queues","Advanced Financial Reports","Custom Letterhead Branding","Dedicated Account Manager"]',                                              NOW(), NOW());

-- Super Admin (Password: Admin@123)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-super-admin', 'admin@clinicflow.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'SUPER_ADMIN', 'ACTIVE', NOW(), NOW());

-- Demo Clinic
INSERT IGNORE INTO `clinics` (`id`, `name`, `slug`, `address`, `phone`, `email`, `city`, `state`, `pincode`, `tokenPrefix`, `status`, `createdAt`, `updatedAt`) VALUES
('clinic-sharma', 'Sharma Healthcare & Polyclinic', 'sharma-healthcare', 'Plot 42, Sunrise Arcade, MG Road', '+91 98200 11223', 'contact@sharmahealthcare.com', 'Mumbai', 'Maharashtra', '400050', 'SHR', 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO `subscriptions` (`id`, `clinicId`, `planId`, `status`, `startDate`, `endDate`, `billingCycle`, `amount`, `createdAt`, `updatedAt`) VALUES
('sub-sharma-1', 'clinic-sharma', 'plan-pro', 'ACTIVE', NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'YEARLY', 24990.00, NOW(), NOW());

-- Doctor 1 — Dr. Raj Sharma (Password: Doctor@123)
INSERT IGNORE INTO `users`        (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-dr-raj', 'dr.raj@sharmaclinic.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'DOCTOR', 'ACTIVE', NOW(), NOW());
INSERT IGNORE INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`, `createdAt`, `updatedAt`) VALUES
('cu-dr-raj', 'clinic-sharma', 'user-dr-raj', 'DOCTOR', TRUE, NOW(), NOW());
INSERT IGNORE INTO `doctors`      (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `specialization`, `qualification`, `registrationNumber`, `consultationFee`, `workingDays`, `workingHours`, `status`, `createdAt`, `updatedAt`) VALUES
('doc-dr-raj', 'clinic-sharma', 'user-dr-raj', 'Dr. Raj Sharma', 'dr.raj@sharmaclinic.com', '9820011223', 'Cardiology & Internal Medicine', 'MBBS, MD (Medicine), DM (Cardio)', 'MMC-2012-99881', 700.00, '["MON","TUE","WED","THU","FRI","SAT"]', '{"start":"09:00 AM","end":"06:00 PM"}', 'ACTIVE', NOW(), NOW());

-- Doctor 2 — Dr. Priya Patel (Password: Doctor@123)
INSERT IGNORE INTO `users`        (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-dr-priya', 'dr.priya@sharmaclinic.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'DOCTOR', 'ACTIVE', NOW(), NOW());
INSERT IGNORE INTO `clinic_users` (`id`, `clinicId`, `userId`, `role`, `isOwner`, `createdAt`, `updatedAt`) VALUES
('cu-dr-priya', 'clinic-sharma', 'user-dr-priya', 'DOCTOR', FALSE, NOW(), NOW());
INSERT IGNORE INTO `doctors`      (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `specialization`, `qualification`, `registrationNumber`, `consultationFee`, `workingDays`, `workingHours`, `status`, `createdAt`, `updatedAt`) VALUES
('doc-dr-priya', 'clinic-sharma', 'user-dr-priya', 'Dr. Priya Patel', 'dr.priya@sharmaclinic.com', '9820033445', 'General Medicine & Diabetology', 'MBBS, DNB (Family Medicine)', 'MMC-2016-55442', 500.00, '["MON","TUE","WED","THU","FRI","SAT"]', '{"start":"10:00 AM","end":"07:00 PM"}', 'ACTIVE', NOW(), NOW());

-- Receptionist — Anjali Verma (Password: Reception@123)
INSERT IGNORE INTO `users`          (`id`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('user-rec-anjali', 'reception@sharmaclinic.com', '$2a$10$m00nK0R2VfC7XwE1s8kU..x2lOqJ5lC8pD2mN1b7k2d8h4l9u8m12', 'RECEPTIONIST', 'ACTIVE', NOW(), NOW());
INSERT IGNORE INTO `clinic_users`   (`id`, `clinicId`, `userId`, `role`, `isOwner`, `createdAt`, `updatedAt`) VALUES
('cu-rec-anjali', 'clinic-sharma', 'user-rec-anjali', 'RECEPTIONIST', FALSE, NOW(), NOW());
INSERT IGNORE INTO `receptionists`  (`id`, `clinicId`, `userId`, `name`, `email`, `mobile`, `status`, `createdAt`, `updatedAt`) VALUES
('rec-anjali', 'clinic-sharma', 'user-rec-anjali', 'Anjali Verma', 'reception@sharmaclinic.com', '9820055667', 'ACTIVE', NOW(), NOW());
```

---

## Useful Commands Reference

```bash
# ── Backend ───────────────────────────────────────────────────────────
npm run dev             # Start backend in watch/hot-reload mode
npm run build           # Compile TypeScript → dist/
npm run start           # Run compiled production build
npm run prisma:seed     # Re-seed the database
npm run test            # Run API integration tests

# ── Frontend ──────────────────────────────────────────────────────────
npm run dev             # Start Vite dev server (hot reload)
npm run build           # Build production bundle → dist/
npm run preview         # Preview production build locally

# ── Prisma (from /backend) ────────────────────────────────────────────
npx prisma studio       # Open browser GUI to inspect the database
npx prisma db push      # Sync schema to database (no migration history)
npx prisma migrate dev  # Create and apply a migration
npx prisma migrate reset # Reset and re-seed (WARNING: clears all data)
```
