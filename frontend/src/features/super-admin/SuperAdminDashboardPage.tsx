import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { Card, StatCard } from '../../components/ui/Card.js';

import { StatusBadge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import {
  Building2,
  Users,
  CreditCard,
  UserCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/dashboard');
      return res.data.data;
    },
  });

  const metrics = stats?.metrics;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Super Admin Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Global telemetry, tenant isolation status, MRR revenue, and clinic subscriptions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/super-admin/clinics')}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 shrink-0"
        >
          Provision New Clinic
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clinics"
          value={isLoading ? '...' : metrics?.totalClinics || 0}
          subtitle={`${metrics?.activeClinics || 0} Active • ${metrics?.trialClinics || 0} Trial`}
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          title="Monthly Revenue (MRR)"
          value={isLoading ? '...' : `₹${(metrics?.mrr || 0).toLocaleString()}`}
          subtitle="Active Subscriptions"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          trend={{ value: '12.4%', isPositive: true }}
        />

        <StatCard
          title="Doctors Onboarded"
          value={isLoading ? '...' : metrics?.totalDoctors || 0}
          subtitle="Across all clinics"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-brand-50 text-brand-600"
        />

        <StatCard
          title="Total Patient Base"
          value={isLoading ? '...' : metrics?.totalPatients || 0}
          subtitle={`${metrics?.totalAppointments || 0} Total Visits`}
          icon={<Activity className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clinics Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Clinic Onboardings</h2>
                <p className="text-xs text-slate-500">Live tenant status and subscriber details</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/super-admin/clinics')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View All Clinics
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Clinic Name</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Doctors</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.recentClinics?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">slug: {c.slug}</div>
                      </td>
                      <td className="p-3 text-slate-600">{c.city}</td>
                      <td className="p-3">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {c.planName}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{c.doctorCount} Doctors</td>
                      <td className="p-3">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Subscription Plan Distribution */}
        <div className="space-y-4">
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Plan Tiers & Distribution</h2>
              <p className="text-xs text-slate-500">Active tenant subscriptions by tier</p>
            </div>

            <div className="space-y-3">
              {stats?.planDistribution?.map((p: any) => (
                <div key={p.code} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{p.planName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">₹{p.price.toLocaleString()} / month</div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600">{p.count}</span>
                    <span className="text-[11px] text-slate-400 block">Clinics</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate('/super-admin/plans')}
            >
              Manage Subscription Plans
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
