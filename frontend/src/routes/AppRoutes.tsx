import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { RoleGuard } from '../components/layout/RoleGuard.js';
import { AppLayout } from '../components/layout/AppLayout.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { LandingPage } from "../features/landing/LandingPage.js";

// Super Admin Pages
import { SuperAdminDashboardPage } from "../features/super-admin/SuperAdminDashboardPage.js";
import { ClinicsManagementPage } from "../features/super-admin/ClinicsManagementPage.js";
import { PlansPage } from "../features/super-admin/PlansPage.js";

// Doctor Pages
import { DoctorDashboardPage } from "../features/doctor/DoctorDashboardPage.js";

// Receptionist Pages
import { ReceptionistDashboardPage } from "../features/receptionist/ReceptionistDashboardPage.js";

// Shared Feature Pages
import { PatientsPage } from "../features/patients/PatientsPage.js";
import { PatientProfilePage } from "../features/patients/PatientProfilePage.js";
import { AppointmentsPage } from "../features/appointments/AppointmentsPage.js";
import { QueuePage } from "../features/queue/QueuePage.js";
import { ConsultationRoomPage } from "../features/consultation/ConsultationRoomPage.js";
import { PrescriptionsPage } from "../features/prescriptions/PrescriptionsPage.js";
import { BillingPage } from "../features/billing/BillingPage.js";
import { StaffPage } from "../features/staff/StaffPage.js";
import { ReportsPage } from "../features/reports/ReportsPage.js";
import { ClinicSettingsPage } from "../features/settings/ClinicSettingsPage.js";
import { Loader2 } from "lucide-react";

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      <span className="text-sm font-medium text-slate-500">
        Loading MediNovel...
      </span>
    </div>
  </div>
);

const HomeRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <LandingPage />;

  if (role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  if (role === "DOCTOR") return <Navigate to="/doctor-dashboard" replace />;
  if (role === "RECEPTIONIST") return <Navigate to="/reception-desk" replace />;
  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<LoginPage adminOnly />} />

      {/* Home redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* ── Super Admin Routes ── */}
      <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
          <Route path="/super-admin/clinics" element={<ClinicsManagementPage />} />
          <Route path="/super-admin/plans" element={<PlansPage />} />
        </Route>
      </Route>

      {/* ── Doctor-only Routes ── */}
      <Route element={<RoleGuard allowedRoles={['DOCTOR']} />}>
        <Route element={<AppLayout />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<ClinicSettingsPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Route>
      </Route>

      {/* ── Receptionist-only Routes ── */}
      <Route element={<RoleGuard allowedRoles={['RECEPTIONIST']} />}>
        <Route element={<AppLayout />}>
          <Route path="/reception-desk" element={<ReceptionistDashboardPage />} />
        </Route>
      </Route>

      {/* ── Shared Doctor + Receptionist Routes ── */}
      <Route element={<RoleGuard allowedRoles={['DOCTOR', 'RECEPTIONIST']} />}>
        <Route element={<AppLayout />}>
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientProfilePage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/queue/:appointmentId/consult" element={<ConsultationRoomPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
