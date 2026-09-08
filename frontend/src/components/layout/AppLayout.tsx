import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Header } from './Header.js';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  FileText,
  CreditCard,
  UserCheck,
  Settings,
  BarChart3,
  Building2,
  Package,
  Menu,
  X,
  PlusCircle,
  Stethoscope,
} from 'lucide-react';
import { clsx } from 'clsx';

export const AppLayout: React.FC = () => {
  const { role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation items based on current role
  const getNavItems = () => {
    if (role === 'SUPER_ADMIN') {
      return [
        { label: 'Platform Overview', path: '/super-admin', icon: LayoutDashboard },
        { label: 'Clinic Tenants', path: '/super-admin/clinics', icon: Building2 },
        { label: 'Subscription Plans', path: '/super-admin/plans', icon: Package },
      ];
    }

    if (role === 'DOCTOR') {
      return [
        { label: 'Doctor Dashboard', path: '/doctor-dashboard', icon: LayoutDashboard },
        { label: 'Live Queue & Consult', path: '/queue', icon: Layers },
        { label: 'Patient Master', path: '/patients', icon: Users },
        { label: 'Appointments', path: '/appointments', icon: Calendar },
        { label: 'Prescriptions', path: '/prescriptions', icon: FileText },
        { label: 'Billing & POS', path: '/billing', icon: CreditCard },
        { label: 'Clinic Staff', path: '/staff', icon: UserCheck },
        { label: 'Financial Reports', path: '/reports', icon: BarChart3 },
        { label: 'Clinic Settings', path: '/settings', icon: Settings },
      ];
    }

    // Receptionist Nav Items
    return [
      { label: 'Reception Desk', path: '/reception-desk', icon: LayoutDashboard },
      { label: 'Daily Queue Board', path: '/queue', icon: Layers },
      { label: 'Patient Directory', path: '/patients', icon: Users },
      { label: 'Appointments', path: '/appointments', icon: Calendar },
      { label: 'Fee Collection', path: '/billing', icon: CreditCard },
      { label: 'Doctors Roster', path: '/staff', icon: UserCheck },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base">
            Medi<span className="text-brand-600">Nodes</span>
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 sticky top-0 h-screen z-40 select-none">
          {/* Brand Logo */}
          <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">
                Medi<span className="text-brand-400">Nodes</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-400 block -mt-1">
                Clinical SaaS
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {role === "SUPER_ADMIN"
                ? "Platform Management"
                : "Clinic Navigation"}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={
                    item.path === "/super-admin" ||
                    item.path === "/doctor-dashboard" ||
                    item.path === "/reception-desk"
                  }
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70",
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            MediNovel Enterprise v1.0.0
          </div>
        </aside>

        {/* Mobile Slide-Over Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 bg-slate-900 text-slate-300 flex flex-col h-full z-10 p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                    MN
                  </div>
                  <span className="font-bold text-white">MediNovel</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      end={
                        item.path === "/super-admin" ||
                        item.path === "/doctor-dashboard" ||
                        item.path === "/reception-desk"
                      }
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-brand-600 text-white"
                            : "text-slate-400 hover:text-white hover:bg-slate-800",
                        )
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
