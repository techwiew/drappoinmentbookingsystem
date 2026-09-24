import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { RoleGuard } from '../components/layout/RoleGuard.js';
import { AppLayout } from '../components/layout/AppLayout.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { LandingPage } from "../features/landing/LandingPage.js";

const PasswordResetPage = lazy(() => import('../features/auth/PasswordResetPage.js').then((module) => ({ default: module.PasswordResetPage })));
const SuperAdminDashboardPage = lazy(() => import('../features/super-admin/SuperAdminDashboardPage.js').then((module) => ({ default: module.SuperAdminDashboardPage })));
const ClinicsManagementPage = lazy(() => import('../features/super-admin/ClinicsManagementPage.js').then((module) => ({ default: module.ClinicsManagementPage })));
const PlansPage = lazy(() => import('../features/super-admin/PlansPage.js').then((module) => ({ default: module.PlansPage })));
const DoctorDashboardPage = lazy(() => import('../features/doctor/DoctorDashboardPage.js').then((module) => ({ default: module.DoctorDashboardPage })));
const ReceptionistDashboardPage = lazy(() => import('../features/receptionist/ReceptionistDashboardPage.js').then((module) => ({ default: module.ReceptionistDashboardPage })));
const PatientsPage = lazy(() => import('../features/patients/PatientsPage.js').then((module) => ({ default: module.PatientsPage })));
const PatientProfilePage = lazy(() => import('../features/patients/PatientProfilePage.js').then((module) => ({ default: module.PatientProfilePage })));
const AppointmentsPage = lazy(() => import('../features/appointments/AppointmentsPage.js').then((module) => ({ default: module.AppointmentsPage })));
const QueuePage = lazy(() => import('../features/queue/QueuePage.js').then((module) => ({ default: module.QueuePage })));
const ConsultationRoomPage = lazy(() => import('../features/consultation/ConsultationRoomPage.js').then((module) => ({ default: module.ConsultationRoomPage })));
const PrescriptionsPage = lazy(() => import('../features/prescriptions/PrescriptionsPage.js').then((module) => ({ default: module.PrescriptionsPage })));
const BillingPage = lazy(() => import('../features/billing/BillingPage.js').then((module) => ({ default: module.BillingPage })));
const StaffPage = lazy(() => import('../features/staff/StaffPage.js').then((module) => ({ default: module.StaffPage })));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage.js').then((module) => ({ default: module.ReportsPage })));
const ClinicSettingsPage = lazy(() => import('../features/settings/ClinicSettingsPage.js').then((module) => ({ default: module.ClinicSettingsPage })));
const AdmissionsPage = lazy(() => import('../features/admissions/AdmissionsPage.js').then((module) => ({ default: module.AdmissionsPage })));
const FaqPage = lazy(() => import('../features/faq/FaqPage.tsx').then((module) => ({ default: module.FaqPage })));
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

const OwnerSettings: React.FC = () => {
  const { user } = useAuth();
  return user?.isOwner ? <ClinicSettingsPage /> : <Navigate to="/doctor-dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<LoginPage adminOnly />} />
      <Route path="/forgot-password" element={<PasswordResetPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
      <Route path="/faq" element={<FaqPage />} />

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
          <Route path="/settings" element={<OwnerSettings />} />
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
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Route>
      </Route>

      <Route element={<RoleGuard allowedRoles={['DOCTOR']} />}>
        <Route element={<AppLayout />}>
          <Route path="/queue/:appointmentId/consult" element={<ConsultationRoomPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};
