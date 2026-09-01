import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { StatusBadge, Badge } from '../../components/ui/Badge.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  Layers,
  ChevronRight,
  SkipForward,
  UserX,
  PlayCircle,
  CheckCircle2,
  Clock,
  Phone,
  Stethoscope,
  ArrowRight,
  RefreshCcw,
  LayoutGrid,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QueuePage: React.FC = () => {
  const { role, doctorId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || '');

  const { data: doctors } = useQuery({
    queryKey: ['doctors-quick'],
    queryFn: async () => {
      const res = await apiClient.get('/doctors');
      return res.data.data;
    },
    enabled: role !== 'DOCTOR',
  });

  const queueDoctorId = role === 'DOCTOR' ? doctorId : selectedDoctorId;

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['live-queue', queueDoctorId],
    queryFn: async () => {
      const params: any = {};
      if (queueDoctorId) params.doctorId = queueDoctorId;
      const res = await apiClient.get('/queue', { params });
      return res.data.data;
    },
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: async (aptId: string) => {
      const res = await apiClient.post(`/queue/${aptId}/start`);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-queue'] }),
  });

  const skipMutation = useMutation({
    mutationFn: async (aptId: string) => {
      const res = await apiClient.post(`/queue/${aptId}/skip`);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-queue'] }),
  });

  const noShowMutation = useMutation({
    mutationFn: async (aptId: string) => {
      const res = await apiClient.post(`/queue/${aptId}/no-show`);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-queue'] }),
  });

  const summary = queueData?.summary;
  const currentPatient = queueData?.currentPatient;
  const waitingList = queueData?.waitingList || [];
  const completedList = queueData?.completedList || [];
  const skippedList = queueData?.skippedList || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-600" />
            Live Queue Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time queue board — auto-refreshes every 5 seconds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['live-queue'] })}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Refresh Queue"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>

          {/* Doctor Filter (Receptionist only) */}
          {role !== 'DOCTOR' && doctors && doctors.length > 1 && (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Doctors</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary Stat Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Today', value: summary?.total ?? 0, color: 'text-slate-900' },
          { label: 'Waiting', value: summary?.waiting ?? 0, color: 'text-amber-600' },
          { label: 'In Consultation', value: summary?.inConsultation ?? 0, color: 'text-brand-600' },
          { label: 'Completed', value: summary?.completed ?? 0, color: 'text-emerald-600' },
          { label: 'Skipped / No-Show', value: (summary?.skipped ?? 0) + (summary?.noShow ?? 0), color: 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-soft p-3 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Queue Board — Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Current & Call Next */}
        <div className="space-y-4">
          {/* Current Patient Hero */}
          <Card className="border-2 border-brand-300 bg-gradient-to-br from-brand-50 to-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Now In Consultation</span>
            </div>

            {isLoading ? (
              <div className="animate-pulse h-20 bg-brand-100 rounded-xl" />
            ) : currentPatient ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg font-black shadow">
                    {currentPatient.tokenNumber}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-900">{currentPatient.patientName}</div>
                    <div className="text-xs text-slate-500">
                      {currentPatient.patientGender} • {currentPatient.patientAge ? `${currentPatient.patientAge} yrs` : '—'}
                    </div>
                    <div className="text-xs text-slate-400">{currentPatient.appointmentTime}</div>
                  </div>
                </div>

                {role === 'DOCTOR' && (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate(`/queue/${currentPatient.id}/consult`)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Open Consultation Room
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Stethoscope className="w-10 h-10 mx-auto text-brand-200 mb-2" />
                <p className="text-sm text-slate-500">No active consultation</p>
                {waitingList.length > 0 && role === 'DOCTOR' && (
                  <Button
                    size="sm"
                    className="mt-3"
                    variant="primary"
                    isLoading={startMutation.isPending}
                    onClick={() => startMutation.mutate(waitingList[0].id)}
                  >
                    Call Token #{waitingList[0].tokenNumber}
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Next Patient Preview */}
          {waitingList.length > 0 && (
            <Card className="border border-amber-200 bg-amber-50/60">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Next Patient</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                    {waitingList[0].tokenNumber}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{waitingList[0].patientName}</div>
                    <div className="text-xs text-slate-500">{waitingList[0].appointmentTime}</div>
                  </div>
                </div>

                {role === 'DOCTOR' && currentPatient && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    isLoading={startMutation.isPending}
                    onClick={() => startMutation.mutate(waitingList[0].id)}
                  >
                    Call Next
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Waiting Queue Table */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                Waiting Queue ({waitingList.length})
              </div>
            </div>

            {waitingList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p>Queue is empty</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Token</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Time</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waitingList.map((apt: any, idx: number) => (
                      <tr key={apt.id} className={`hover:bg-slate-50 transition-colors ${idx === 0 ? 'bg-amber-50/60' : ''}`}>
                        <td className="p-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {apt.tokenNumber}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{apt.patientName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {apt.patientMobile}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="default" size="sm">
                            {apt.appointmentType?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-500">{apt.appointmentTime}</td>
                        <td className="p-3 text-right space-x-1">
                          {role === 'DOCTOR' && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="text-[11px]"
                              isLoading={startMutation.isPending}
                              onClick={() => startMutation.mutate(apt.id)}
                            >
                              Call
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] text-purple-600 hover:bg-purple-50"
                            isLoading={skipMutation.isPending}
                            onClick={() => skipMutation.mutate(apt.id)}
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] text-rose-600 hover:bg-rose-50"
                            isLoading={noShowMutation.isPending}
                            onClick={() => noShowMutation.mutate(apt.id)}
                          >
                            No Show
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Completed List (Collapsible) */}
      {completedList.length > 0 && (
        <Card>
          <div className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Completed Today ({completedList.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {completedList.map((apt: any) => (
              <div key={apt.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
                <span className="font-bold text-emerald-700">#{apt.tokenNumber}</span>
                <span className="text-emerald-800">{apt.patientName}</span>
                <StatusBadge status={apt.paymentStatus || 'PENDING'} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
