import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { StatusBadge, Badge } from '../../components/ui/Badge.js';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  SkipForward,
  TrendingUp,
  Activity,
  ArrowRight,
  UserX,
  Stethoscope,
  IndianRupee,
  Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const DoctorDashboardPage: React.FC = () => {
  const { user, doctorId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const todayStr = new Date().toISOString().split('T')[0];

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['doctor-kpis', doctorId],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/doctor-dashboard?doctorId=${doctorId}`);
      return res.data.data.kpis;
    },
    enabled: !!doctorId,
    refetchInterval: 15000,
  });

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['live-queue', doctorId],
    queryFn: async () => {
      const res = await apiClient.get(`/queue?doctorId=${doctorId}`);
      return res.data.data;
    },
    enabled: !!doctorId,
    refetchInterval: 10000,
  });

  const callNextMutation = useMutation({
    mutationFn: async () => {
      const nextId = queueData?.nextPatient?.id || queueData?.waitingList?.[0]?.id;
      if (!nextId) throw new Error('No next patient in queue');
      const res = await apiClient.post(`/queue/${nextId}/start`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-queue', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-kpis', doctorId] });
    },
  });

  const currentPatient = queueData?.currentPatient;
  const nextPatient = queueData?.waitingList?.[0];
  const waitingList = queueData?.waitingList || [];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-5 h-5 text-brand-200" />
              <span className="text-sm font-semibold text-brand-100">Doctor's Workstation</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.doctor?.name || user?.name}!
            </h1>
            <p className="text-brand-200 text-xs mt-1">
              {user?.doctor?.specialization} • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={() => navigate('/queue')}
              leftIcon={<Activity className="w-4 h-4" />}
            >
              Live Queue
            </Button>
            <Button
              variant="primary"
              className="bg-white text-brand-700 hover:bg-brand-50 shadow-md"
              onClick={() => navigate('/appointments')}
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Today's Schedule
            </Button>
            <Button
              variant="primary"
              className="ml-3 bg-white text-brand-700 hover:bg-brand-50 shadow-md"
              onClick={() => navigate('/appointments')}
              leftIcon={<Users className="w-4 h-4" />}
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Total"
          value={kpisLoading ? '...' : kpis?.totalToday ?? 0}
          subtitle="Total appointments"
          icon={<Calendar className="w-5 h-5" />}
          iconBgColor="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Waiting Now"
          value={kpisLoading ? '...' : kpis?.waitingCount ?? 0}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Completed"
          value={kpisLoading ? '...' : kpis?.completedCount ?? 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="No Shows"
          value={kpisLoading ? '...' : kpis?.noShowCount ?? 0}
          icon={<UserX className="w-5 h-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Today's Collection"
          value={kpisLoading ? '...' : `₹${(kpis?.todayCollection ?? 0).toLocaleString()}`}
          subtitle="Fee collected"
          icon={<IndianRupee className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          trend={{ value: '', isPositive: true }}
        />
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Live Queue Hero Widget */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Patient Card */}
          <Card className="border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  Currently In Consultation
                </span>
              </div>
              <Badge variant="primary" size="sm" dot>Live</Badge>
            </div>

            {queueLoading ? (
              <div className="animate-pulse h-24 bg-brand-100 rounded-xl" />
            ) : currentPatient ? (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {currentPatient.tokenNumber}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">{currentPatient.patientName}</div>
                      <div className="text-xs text-slate-500">
                        {currentPatient.patientGender} • {currentPatient.patientAge ? `${currentPatient.patientAge} yrs` : '—'} • {currentPatient.patientNumber}
                      </div>
                    </div>
                    {currentPatient.patientMobile && <a href={`tel:${currentPatient.patientMobile}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline" title={`Call ${currentPatient.patientName}`}><Phone className="h-3.5 w-3.5" /> Call patient</a>}
                  </div>
                  <div className="text-xs text-slate-600">
                    Type: <span className="font-semibold">{currentPatient.appointmentType?.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/queue/${currentPatient.id}/consult`)}
                >
                  Open Consultation
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="font-semibold text-sm">No patient currently in consultation</p>
                {waitingList.length > 0 && (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="primary"
                    isLoading={callNextMutation.isPending}
                    onClick={() => callNextMutation.mutate()}
                  >
                    Call First Patient (Token #{waitingList[0]?.tokenNumber})
                  </Button>
                )}
              </div>
            )}

            {/* Call Next Action Bar */}
            {currentPatient && nextPatient && (
              <div className="mt-4 pt-4 border-t border-brand-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Next: <span className="font-bold text-slate-800">#{nextPatient.tokenNumber} — {nextPatient.patientName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={<SkipForward className="w-3.5 h-3.5" />}
                  isLoading={callNextMutation.isPending}
                  onClick={() => callNextMutation.mutate()}
                >
                  Call Next Patient
                </Button>
              </div>
            )}
          </Card>

          {/* Waiting Queue List */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-slate-900">Waiting Queue</div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/queue')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Full Queue Board
              </Button>
            </div>

            {waitingList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Queue is empty — all patients handled or not yet arrived.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {waitingList.slice(0, 8).map((pt: any, idx: number) => (
                  <div
                    key={pt.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${idx === 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {pt.tokenNumber}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{pt.patientName}</div>
                        <div className="text-[10px] text-slate-400">
                          {pt.patientGender} • {pt.appointmentTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2"><StatusBadge status={pt.status} size="sm" />{pt.patientMobile && <a href={`tel:${pt.patientMobile}`} onClick={(event) => event.stopPropagation()} className="text-emerald-700" title={`Call ${pt.patientName}`}><Phone className="h-3.5 w-3.5" /></a>}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Follow-ups & Stats */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Upcoming Follow-Ups</h2>
            </div>

            {kpis?.followUpsCount === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No scheduled follow-ups today
              </div>
            ) : (
              <div className="text-sm text-slate-600 space-y-2">
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-center">
                  <div className="text-2xl font-black text-brand-700">{kpis?.followUpsCount ?? 0}</div>
                  <div className="text-xs text-brand-500 font-medium">Follow-up Visits Today</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/appointments')}
                >
                  View Appointment Schedule
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Patient Breakdown</h2>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">🆕 New Patients</span>
                <span className="font-bold text-slate-900">{kpis?.newPatientsCount ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">🔁 Returning</span>
                <span className="font-bold text-slate-900">{kpis?.returningPatientsCount ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                <span className="text-slate-600">💳 Pending Payments</span>
                <span className="font-bold text-rose-600">₹{(kpis?.pendingPayments ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => navigate('/billing')}
            >
              Open Billing & POS
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
