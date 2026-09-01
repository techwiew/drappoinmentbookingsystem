import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Role } from '../../types/index.js';
import { Loader2 } from 'lucide-react';

export const RoleGuard: React.FC<{ allowedRoles: Role[] }> = ({ allowedRoles }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-medium text-slate-500">Loading ClinicFlow...</span>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to proper home based on role
    if (role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
    if (role === 'DOCTOR') return <Navigate to="/doctor-dashboard" replace />;
    if (role === 'RECEPTIONIST') return <Navigate to="/reception-desk" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
