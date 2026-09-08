import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { StatusBadge, Badge } from '../../components/ui/Badge.js';
import {
  Layers,
  Users,
  Calendar,
  CheckCircle2,
  SkipForward,
  ChevronRight,
  UserPlus,
  Clock,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReceptionistDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['reception-queue'],
    queryFn: async () => {
      const res = await apiClient.get('/queue');
      return res.data.data;
    },
    refetchInterval: 8000,
  });

  const { data: todayStats } = useQuery({
    queryKey: ['reception-today'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/receptionist-dashboard');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const allQueue: any[] = queueData?.allQueue || [];
  const currentPatients = allQueue.filter((a) => a.status === 'IN_CONSULTATION');
  const waitingList = allQueue.filter((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN');
  const completedToday = allQueue.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Reception Desk</h1>
            <p className="text-sky-200 text-xs mt-1">
              {user?.receptionist?.name || user?.name} • {user?.clinic?.name} • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              variant="secondary"
              size="sm"
              onClick={() => navigate('/patients')}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Register Patient
            </Button>
            <Button
              className="bg-white text-sky-700 hover:bg-sky-50 shadow-md font-semibold"
              variant="primary"
              size="sm"
              onClick={() => navigate('/appointments')}
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Today"
          value={allQueue.length}
          icon={<Calendar className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Currently Seeing"
          value={currentPatients.length}
          icon={<Layers className="w-5 h-5" />}
          iconBgColor="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Waiting Now"
          value={waitingList.length}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Completed"
          value={completedToday.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Live Multi-Doctor Queue Board */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Multi-Doctor Queue Board</h2>
            <p className="text-xs text-slate-500">Real-time queue status across all doctors</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/queue')}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Full Queue View
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse h-14 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : allQueue.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Layers className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="font-semibold text-sm">No appointments in today's queue</p>
            <Button
              className="mt-3"
              size="sm"
              variant="primary"
              onClick={() => navigate('/appointments')}
            >
              Book First Appointment
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Token</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allQueue.slice(0, 20).map((apt: any) => (
                  <tr
                    key={apt.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      apt.status === 'IN_CONSULTATION' ? 'bg-brand-50/40' :
                      apt.status === 'WAITING' ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="p-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        apt.status === 'IN_CONSULTATION' ? 'bg-brand-600 text-white' :
                        apt.status === 'WAITING' ? 'bg-amber-500 text-white' :
                        apt.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {apt.tokenNumber}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{apt.patientName}</span>
                        {apt.patientMobile && (
                          <a
                            href={`tel:${apt.patientMobile}`}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            title={`Call ${apt.patientName} (${apt.patientMobile})`}
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{apt.patientNumber}</span>
                        {apt.patientMobile && (
                          <span className="text-slate-500">{apt.patientMobile}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{apt.doctorName}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">
                        {apt.appointmentType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{apt.appointmentTime}</td>
                    <td className="p-3"><StatusBadge status={apt.status} size="sm" /></td>
                    <td className="p-3">
                      <StatusBadge status={apt.paymentStatus || 'PENDING'} size="sm" />
                    </td>
                    <td className="p-3 text-right">
                      {apt.status === 'COMPLETED' && apt.paymentStatus !== 'PAID' && (
                        <Button
                          size="sm"
                          variant="success"
                          className="text-[11px] px-2 py-1"
                          onClick={() => navigate(`/billing?appointmentId=${apt.id}`)}
                        >
                          Collect Fee
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Unfinished Payments Alert */}
      {allQueue.filter((a) => a.status === 'COMPLETED' && a.paymentStatus !== 'PAID').length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-rose-800">
              {allQueue.filter((a) => a.status === 'COMPLETED' && a.paymentStatus !== 'PAID').length} Completed Consultation(s) with Pending Payment
            </div>
            <div className="text-xs text-rose-600 mt-0.5">
              Please collect outstanding fees before patients leave the clinic.
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => navigate('/billing')}
          >
            Go to Billing
          </Button>
        </div>
      )}
    </div>
  );
};
