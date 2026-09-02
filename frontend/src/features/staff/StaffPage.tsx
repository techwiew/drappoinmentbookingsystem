
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { StatusBadge, Badge } from '../../components/ui/Badge.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  Users,
  Stethoscope,
  Plus,
  UserCheck,
  Phone,
  Mail,
  IndianRupee,
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const { role, doctorId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'doctors' | 'receptionists'>('doctors');
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isAddRecModalOpen, setIsAddRecModalOpen] = useState(false);

  const [docForm, setDocForm] = useState({
    name: '',
    email: '',
    password: 'Doctor@123',
    mobile: '',
    specialization: '',
    qualification: 'MBBS',
    registrationNumber: '',
    consultationFee: 500,
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  });

  const [recForm, setRecForm] = useState({
    name: '',
    email: '',
    password: 'Reception@123',
    mobile: '',
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await apiClient.get('/doctors');
      return res.data.data;
    },
  });

  const { data: receptionists, isLoading: recsLoading } = useQuery({
    queryKey: ['receptionists'],
    queryFn: async () => {
      const res = await apiClient.get('/receptionists');
      return res.data.data;
    },
  });

  const addDoctorMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/doctors', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setIsAddDocModalOpen(false);
    },
  });

  const addReceptionistMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/receptionists', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] });
      setIsAddRecModalOpen(false);
    },
  });

  const weekdays = [
    { code: 'MON', label: 'Mon' },
    { code: 'TUE', label: 'Tue' },
    { code: 'WED', label: 'Wed' },
    { code: 'THU', label: 'Thu' },
    { code: 'FRI', label: 'Fri' },
    { code: 'SAT', label: 'Sat' },
    { code: 'SUN', label: 'Sun' },
  ];

  const toggleWorkingDay = (day: string) => {
    const updated = docForm.workingDays.includes(day)
      ? docForm.workingDays.filter((d) => d !== day)
      : [...docForm.workingDays, day];
    setDocForm({ ...docForm, workingDays: updated });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            Clinic Staff Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage doctors and receptionists, working hours, and fee schedules
          </p>
        </div>

        <div className="flex gap-2">
          {role === 'DOCTOR' && activeTab === 'doctors' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddDocModalOpen(true)}
            >
              Add Doctor
            </Button>
          )}
          {role === 'RECEPTIONIST' && activeTab === 'receptionists' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddRecModalOpen(true)}
            >
              Add Receptionist
            </Button>
          )}
          {role === 'DOCTOR' && activeTab === 'receptionists' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddRecModalOpen(true)}
            >
              Add Receptionist
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'doctors'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          Doctors ({doctors?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('receptionists')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'receptionists'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Receptionists ({receptionists?.length ?? 0})
        </button>
      </div>

      {/* Doctor Cards */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctorsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-48 bg-white rounded-2xl border border-slate-200" />
            ))
          ) : (
            doctors?.map((doc: any) => (
              <Card key={doc.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-lg font-black shadow">
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{doc.name}</div>
                      <div className="text-xs text-slate-500">{doc.specialization}</div>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {doc.mobile}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {doc.email}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3 h-3 text-emerald-500" />
                      <span className="font-semibold text-emerald-700">₹{doc.consultationFee} / consultation</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs">
                    <div className="text-slate-400 mb-1">Working Days:</div>
                    <div className="flex flex-wrap gap-1">
                      {doc.workingDays?.map((d: string) => (
                        <span key={d} className="bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                  <span>Reg: {doc.registrationNumber || 'N/A'}</span>
                  <span>{doc.qualification}</span>
                </div>
              </Card>
            ))
          )}

          {role === 'DOCTOR' && (
            <button
              onClick={() => setIsAddDocModalOpen(true)}
              className="h-48 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-all group"
            >
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Add New Doctor</span>
            </button>
          )}
        </div>
      )}

      {/* Receptionist Cards */}
      {activeTab === 'receptionists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recsLoading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse h-36 bg-white rounded-2xl border border-slate-200" />
            ))
          ) : (
            receptionists?.map((rec: any) => (
              <Card key={rec.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center text-lg font-black shadow">
                    {rec.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{rec.name}</div>
                    <div className="text-xs text-slate-500">Receptionist</div>
                    <StatusBadge status={rec.status} size="sm" />
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{rec.mobile}</div>
                  <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" />{rec.email}</div>
                </div>
              </Card>
            ))
          )}

          <button
            onClick={() => setIsAddRecModalOpen(true)}
            className="h-36 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all group"
          >
            <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Add New Receptionist</span>
          </button>
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddDocModalOpen}
        onClose={() => setIsAddDocModalOpen(false)}
        title="Add New Doctor"
        description="Creates a new doctor account with login credentials"
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); addDoctorMutation.mutate(docForm); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" required value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} />
            <Input label="Mobile" required value={docForm.mobile} onChange={(e) => setDocForm({ ...docForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Login Email" type="email" required value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} />
            <Input label="Initial Password" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Specialization" required value={docForm.specialization} onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })} />
            <Input label="Qualification" value={docForm.qualification} onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })} />
            <Input label="Reg. Number" value={docForm.registrationNumber} onChange={(e) => setDocForm({ ...docForm, registrationNumber: e.target.value })} />
          </div>
          <Input
            label="Consultation Fee (₹)"
            type="number"
            value={docForm.consultationFee}
            onChange={(e) => setDocForm({ ...docForm, consultationFee: parseInt(e.target.value) || 0 })}
          />
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Working Days</label>
            <div className="flex gap-2 flex-wrap">
              {weekdays.map((d) => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => toggleWorkingDay(d.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    docForm.workingDays.includes(d.code)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-50 text-slate-600 border-slate-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAddDocModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={addDoctorMutation.isPending}>
              Create Doctor Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Receptionist Modal */}
      <Modal
        isOpen={isAddRecModalOpen}
        onClose={() => setIsAddRecModalOpen(false)}
        title="Add New Receptionist"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); addReceptionistMutation.mutate(recForm); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" required value={recForm.name} onChange={(e) => setRecForm({ ...recForm, name: e.target.value })} />
            <Input label="Mobile" required value={recForm.mobile} onChange={(e) => setRecForm({ ...recForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Login Email" type="email" required value={recForm.email} onChange={(e) => setRecForm({ ...recForm, email: e.target.value })} />
            <Input label="Initial Password" value={recForm.password} onChange={(e) => setRecForm({ ...recForm, password: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAddRecModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={addReceptionistMutation.isPending}>
              Create Receptionist Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
