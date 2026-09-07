import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { LogOut, User as UserIcon, Building2, Stethoscope, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge.js';

export const Header: React.FC = () => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="purple" size="sm"><ShieldCheck className="w-3 h-3 mr-1" /> Super Admin</Badge>;
      case 'DOCTOR':
        return <Badge variant="primary" size="sm"><Stethoscope className="w-3 h-3 mr-1" /> Doctor</Badge>;
      case 'RECEPTIONIST':
        return <Badge variant="info" size="sm">Receptionist</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Clinic Name / Branding context */}
      <div className="flex items-center gap-3">
        {user?.clinic ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-sm">
              {user.clinic.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {user.clinic.name}
                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {user.clinic.tokenPrefix}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {user.clinic.city}, {user.clinic.state}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              CF
            </div>
            <div className="text-sm font-bold text-slate-800">
              MediNodes Platform Owner Console
            </div>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {getRoleBadge()}

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
            {user?.name ? user.name.charAt(0) : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name || user?.email}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              {user?.email}
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
