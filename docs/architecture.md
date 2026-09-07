# MediNodes — System Architecture & Multi-Tenant Design

## 1. Overview
MediNodes is an enterprise-ready, subscription-based multi-tenant Software-as-a-Service (SaaS) platform built for healthcare practices, outpatient clinics, and polyclinics. The platform provides complete operational autonomy to individual clinics (tenants) while offering centralized oversight, tenant management, and subscription tracking to the platform Super Admin.

---

## 2. Multi-Tenancy Architecture

MediNodes employs a **Pooled Database with Tenant Discriminator (`clinicId`) and Application-Layer Isolation**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                     Client Layer (SPA)                      │
 │    React + TypeScript + Vite + Responsive Tailwind UI       │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / REST / Bearer JWT
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  API Gateway / Express Middleware           │
 │  - Helmet Security Headers                                  │
 │  - Rate Limiting                                            │
 │  - CORS Policy                                              │
 │  - JWT Authentication Middleware                            │
 │  - Tenant Context Resolution Middleware                     │
 │  - Role-Based Access Control (RBAC) Guard                   │
 │  - Zod Request DTO Validation                               │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     Service Layer                           │
 │  - Business Logic & State Machines                          │
 │  - Multi-Doctor Queue Transition Engine                     │
 │  - Immutable Consultation Enforcement                       │
 │  - Financial Calculation Engine (Decimal Precision)         │
 │  - Audit Logging Pipeline                                   │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                Data Access Layer (Prisma ORM)               │
 │  - Enforced Tenant Isolation: { where: { clinicId } }       │
 │  - Atomic Transactions for Token Allocation                 │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                 Relational Database (MySQL)                 │
 │  - Indexed Foreign Keys & Composite Unique Constraints      │
 │  - Decimal(10,2) for all financial currency amounts         │
 └──────────────────────────────┘
```

---

## 3. Strict Tenant Isolation Rules

1. **Zero Trust for Client-Supplied Tenant Identifiers**:
   - The backend **never** trusts `req.body.clinicId` or `req.query.clinicId` from incoming requests.
   - For all clinic users (`DOCTOR`, `RECEPTIONIST`), `clinicId` is resolved strictly from the verified JWT payload and confirmed against the `clinic_users` table in the database.
2. **Mandatory Query Scoping**:
   - Every read, update, delete, and list operation on tenant-owned entities (`patients`, `appointments`, `consultations`, `prescriptions`, `payments`, `doctors`, `receptionists`) includes `clinicId` in the `where` clause.
3. **Super Admin Isolation Boundary**:
   - Super Admins can manage clinics, subscription tiers, and platform statistics.
   - Super Admins cannot inspect private clinical medical records (symptoms, diagnosis, doctor notes) of patients belonging to tenant clinics.

---

## 4. Key Subsystems & State Machines

### 4.1 Queue & Token State Machine
Each clinic doctor maintains a daily sequential token queue.
- `BOOKED`: Appointment scheduled for a specific date and time.
- `CHECKED_IN` / `WAITING`: Patient has arrived at the reception desk, verified details, and received a daily token number.
- `IN_CONSULTATION`: Doctor has called the token and begun the consultation session in their workstation.
- `COMPLETED`: Doctor has finalized diagnosis, clinical advice, and prescription.
- `SKIPPED` / `NO_SHOW` / `CANCELLED`: Terminal or hold states allowing doctors and receptionists to manage patient flow without blocking the queue.

### 4.2 Consultation & Prescription Immutability
- Consultations begin in `DRAFT` status while the doctor records complaints, examination findings, and medications.
- Once marked `COMPLETED`, direct modifications are locked to prevent unauthorized tampering and maintain medical-legal integrity.
- Any subsequent administrative addendum requires explicit audit logging.

### 4.3 Billing & Point-of-Sale (POS)
- Real-time ledger tracking `consultationFee`, `additionalFee`, `discount`, `totalAmount`, `paidAmount`, and `pendingAmount`.
- Supports multi-mode payments (`CASH`, `UPI`, `CARD`, `OTHER`).
- All financial balances are computed via strict decimal arithmetic.
