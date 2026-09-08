# MediNovel — Multi-Tenant Doctor Clinic Management SaaS

MediNovel is a high-performance, subscription-based multi-tenant healthcare software application built with modern web technologies: React 18, TypeScript, Vite, Tailwind CSS, Node.js, Express, and Prisma ORM with MySQL.

---

## 🌟 Key Capabilities
- 🏢 **Strict Multi-Tenancy**: Complete data isolation across clinics at both API and database layers.
- 👑 **Super Admin Platform Console**: Tenant onboarding, subscription tier management, revenue telemetry, and clinic control.
- 🩺 **Doctor Workstation**: Real-time queue view, single-click "Call Next", clinical examination, ICD diagnosis, and electronic prescriptions (Rx).
- 🛎️ **Reception Desk**: Multi-doctor queue switcher, walk-in/emergency registration, instant duplicate patient warning, and appointment booking.
- 📋 **Comprehensive Patient Master**: Multi-doctor assignments, full timeline history, vitals, allergies, and past visits.
- 💊 **Prescription Generator & POS Billing**: Dynamic multi-item prescription generator and instant fee collection with receipt printing.
- 📱 **Fully Responsive**: Optimized for Desktop (1280px/1440px+), Tablet (768px), and Mobile (390px).

---

## 🏗️ Architecture & Documentation
- [System Architecture](docs/architecture.md)
- [Database Schema & ER Models](docs/database.md)
- [REST API Reference](docs/api.md)
- [Security & Tenant Isolation](docs/security.md)
- [MilesWeb / VPS Production Deployment](docs/deployment.md)

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0
- MySQL or PostgreSQL / SQLite (for local rapid testing)
- npm or pnpm

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets
npx prisma db push # or npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🔑 Default Seed Credentials
- **Super Admin**: `admin@MediNovel.com` / `Admin@123`
- **Real Super Admin**: `superadmin@MediNovel.com` / `SuperAdmin@123`
- **Doctor 1**: `dr.raj@sharmaclinic.com` / `Doctor@123`
- **Doctor 2**: `dr.priya@sharmaclinic.com` / `Doctor@123`
- **Receptionist**: `reception@sharmaclinic.com` / `Reception@123`

After signing in as Super Admin, open `/super-admin` and click **Add New Clinic** in the upper-right corner. The form creates the clinic, subscription, and first doctor account in one transaction.
