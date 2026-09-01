import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Users,
  Calendar,
  CreditCard,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { doctorId } = useAuth();

  const { data: doctorData, isLoading } = useQuery({
    queryKey: ['reports-doctor-dash', doctorId],
    queryFn: async () => {
      const res = await apiClient.get('/reports/doctor-dashboard', {
        params: doctorId ? { doctorId } : {},
      });
      return res.data.data;
    },
  });

  const kpis = doctorData?.kpis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600" />
          Financial & Clinical Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time insights on patient volume, consultations, collections, and retention
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Consultations"
          value={isLoading ? '...' : kpis?.completedCount ?? 0}
          subtitle="Completed today"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Daily Fee Revenue"
          value={isLoading ? '...' : `₹${(kpis?.todayCollection ?? 0).toLocaleString()}`}
          subtitle="Collected"
          icon={<IndianRupee className="w-5 h-5" />}
          iconBgColor="bg-brand-50 text-brand-600"
        />

        <StatCard
          title="New Patients"
          value={isLoading ? '...' : kpis?.newPatientsCount ?? 0}
          subtitle="First-time visits"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />

        <StatCard
          title="Follow-ups"
          value={isLoading ? '...' : kpis?.followUpsCount ?? 0}
          subtitle="Scheduled visits"
          icon={<Calendar className="w-5 h-5" />}
          iconBgColor="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Revenue & Patient Volume Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Patient Conversion & Flow</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">New vs Returning Ratio</span>
                <span className="font-bold text-slate-900">
                  {kpis?.newPatientsCount ?? 0} New / {kpis?.returningPatientsCount ?? 0} Returning
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-brand-500 h-full"
                  style={{
                    width: `${
                      ((kpis?.newPatientsCount || 1) /
                        ((kpis?.newPatientsCount || 1) + (kpis?.returningPatientsCount || 1))) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${
                      ((kpis?.returningPatientsCount || 1) /
                        ((kpis?.newPatientsCount || 1) + (kpis?.returningPatientsCount || 1))) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Bookings Today:</span>
                <span className="font-bold text-slate-900">{kpis?.totalToday ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Consultation Completed:</span>
                <span className="font-bold text-emerald-700">{kpis?.completedCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">No-Show / Cancelled:</span>
                <span className="font-bold text-rose-600">{kpis?.noShowCount ?? 0}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">Cash Flow & Outstanding</h2>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-semibold block">Total Revenue Collected</span>
                <span className="text-2xl font-black text-emerald-900">
                  ₹{(kpis?.todayCollection ?? 0).toLocaleString()}
                </span>
              </div>
              <Badge variant="success">Settled</Badge>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-800 font-semibold block">Outstanding Pending Fee</span>
                <span className="text-xl font-black text-rose-900">
                  ₹{(kpis?.pendingPayments ?? 0).toLocaleString()}
                </span>
              </div>
              <Badge variant="danger">Pending Collection</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
