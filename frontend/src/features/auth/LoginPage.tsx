import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import {
  Stethoscope,
  Lock,
  Mail,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const response = await apiClient.post('/auth/login', {
        email: loginEmail,
        password: loginPass,
      });

      const { accessToken, refreshToken, user } = response.data.data;
      login(accessToken, refreshToken, user);

      // Role-based routing
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (user.role === 'DOCTOR') {
        navigate('/doctor-dashboard');
      } else if (user.role === 'RECEPTIONIST') {
        navigate('/reception-desk');
      } else {
        navigate('/patients');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row font-sans selection:bg-brand-500 selection:text-white">
      {/* Left Visual Branding Panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-lg shadow-brand-600/30">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-white text-2xl tracking-tight">
              Clinic<span className="text-brand-400">Flow</span>
            </span>
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block -mt-1">
              Multi-Tenant Clinical SaaS
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="my-10 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation Clinic Management
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Streamlined queues, digital consultations & seamless billing.
          </h1>

          <div className="grid grid-cols-1 gap-3.5 text-slate-300 text-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Strict multi-tenant security & zero cross-clinic leakage</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Doctor-specific live token queue & call-next workstation</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-doctor assignments, duplicate check & Rx printing</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-10">
          © 2026 ClinicFlow Technologies. All rights reserved.
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="md:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your clinic credentials or pick a demo role below.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. dr.raj@sharmaclinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-md shadow-brand-600/20"
              isLoading={isLoading}
            >
              Sign In to ClinicFlow
            </Button>
          </form>

          {/* Quick 1-Click Demo Login Bar */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>⚡ 1-Click Quick Demo Switcher</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@clinicflow.com', 'Admin@123')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-all group text-xs"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Super Admin
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Platform Owner</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dr.raj@sharmaclinic.com', 'Doctor@123')}
                className="p-2.5 rounded-xl border border-brand-200 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-300 text-left transition-all group text-xs"
              >
                <div className="font-bold text-brand-900 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
                  Dr. Raj Sharma
                </div>
                <div className="text-[10px] text-brand-600 mt-0.5 truncate">Cardiologist</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dr.priya@sharmaclinic.com', 'Doctor@123')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group text-xs"
              >
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Dr. Priya Patel
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5 truncate">Physician</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reception@sharmaclinic.com', 'Reception@123')}
                className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-50 hover:border-sky-300 text-left transition-all group text-xs"
              >
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  Reception Desk
                </div>
                <div className="text-[10px] text-sky-600 mt-0.5 truncate">Anjali Verma</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
