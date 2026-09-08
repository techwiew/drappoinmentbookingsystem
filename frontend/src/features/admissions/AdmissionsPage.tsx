import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Modal } from '../../components/ui/Modal.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Bed, ClipboardPlus, CreditCard, Phone, LogOut, Stethoscope } from 'lucide-react';

export const AdmissionsPage: React.FC = () => {
  const { role, doctorId } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isAdmitOpen, setIsAdmitOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [form, setForm] = useState({ patientId: '', attendingDoctorId: doctorId || '', roomNumber: '', bedNumber: '', reason: '', diagnosis: '', notes: '', totalAmount: 0 });

  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId && (role === 'DOCTOR' || role === 'RECEPTIONIST')) {
      setForm((current) => ({ ...current, patientId }));
      setIsAdmitOpen(true);
    }
  }, [role, searchParams]);

  const { data: admissions = [], isLoading } = useQuery({
    queryKey: ['admissions'],
    queryFn: async () => (await apiClient.get('/admissions', { params: { status: 'ADMITTED' } })).data.data,
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['admission-patients'],
    queryFn: async () => (await apiClient.get('/patients', { params: { limit: 100 } })).data.data,
    enabled: isAdmitOpen,
  });
  const { data: doctors = [] } = useQuery({
    queryKey: ['admission-doctors'],
    queryFn: async () => (await apiClient.get('/doctors')).data.data,
    enabled: isAdmitOpen,
  });

  const admitMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admissions', form)).data.data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admissions'] }); setIsAdmitOpen(false); setForm({ patientId: '', attendingDoctorId: doctorId || '', roomNumber: '', bedNumber: '', reason: '', diagnosis: '', notes: '', totalAmount: 0 }); },
  });
  const paymentMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/admissions/${selectedAdmission.id}/payments`, { amount: Number(paymentAmount), paymentMethod: 'CASH' })).data.data,
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['admissions'] }); setSelectedAdmission(data); setPaymentAmount(''); },
  });
  const dischargeMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/admissions/${selectedAdmission.id}/discharge`, { dischargeSummary })).data.data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admissions'] }); setSelectedAdmission(null); setDischargeSummary(''); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Bed className="h-6 w-6 text-brand-600" /> IPD Admissions</h1><p className="mt-1 text-sm text-slate-500">Track admitted patients, rounds, interim payments, and discharge settlement.</p></div>
        {role === 'RECEPTIONIST' && <Button variant="primary" leftIcon={<ClipboardPlus className="h-4 w-4" />} onClick={() => setIsAdmitOpen(true)}>Admit Patient</Button>}
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Loading admitted patients...</p> : admissions.length === 0 ? <Card><div className="py-10 text-center text-sm text-slate-500">No patients are currently admitted.</div></Card> : <div className="grid gap-4 lg:grid-cols-2">{admissions.map((admission: any) => <Card key={admission.id} className="border-l-4 border-l-brand-500"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">{admission.patientName}</h2><Badge variant="warning">{admission.admissionNumber}</Badge></div><p className="mt-1 text-xs text-slate-500">{admission.reason} · Room {admission.roomNumber || 'Unassigned'} / Bed {admission.bedNumber || 'Unassigned'}</p></div><a className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" href={`tel:${admission.patientMobile}`} title={`Call ${admission.patientName}`}><Phone className="h-4 w-4" /></a></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><span className="text-slate-500">Doctor</span><strong className="mt-1 block">{admission.attendingDoctorName || 'Not assigned'}</strong></div><div><span className="text-slate-500">Paid</span><strong className="mt-1 block text-emerald-700">₹{admission.paidAmount.toLocaleString()}</strong></div><div><span className="text-slate-500">Pending</span><strong className="mt-1 block text-rose-700">₹{admission.pendingAmount.toLocaleString()}</strong></div></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedAdmission(admission)} leftIcon={<CreditCard className="h-3.5 w-3.5" />}>Payment / Discharge</Button>{role === 'DOCTOR' && <Button size="sm" variant="secondary" onClick={() => setSelectedAdmission(admission)} leftIcon={<Stethoscope className="h-3.5 w-3.5" />}>Clinical Round</Button>}</div></Card>)}</div>}

      <Modal isOpen={isAdmitOpen} onClose={() => setIsAdmitOpen(false)} title="Admit Patient" description="Create an active inpatient admission.">
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); admitMutation.mutate(); }}><label className="block text-sm font-semibold">Patient<select className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient: any) => <option key={patient.id} value={patient.id}>{patient.fullName} · {patient.mobile}</option>)}</select></label><label className="block text-sm font-semibold">Attending doctor<select className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" value={form.attendingDoctorId} onChange={(e) => setForm({ ...form, attendingDoctorId: e.target.value })}><option value="">Select doctor</option>{doctors.map((doctor: any) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><Input label="Room" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} /><Input label="Bed" value={form.bedNumber} onChange={(e) => setForm({ ...form, bedNumber: e.target.value })} /></div><Input label="Admission reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /><Input label="Initial total (₹)" type="number" min="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) || 0 })} /><div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setIsAdmitOpen(false)}>Cancel</Button><Button type="submit" variant="primary" isLoading={admitMutation.isPending}>Admit Patient</Button></div></form>
      </Modal>

      <Modal isOpen={Boolean(selectedAdmission)} onClose={() => setSelectedAdmission(null)} title={selectedAdmission ? `${selectedAdmission.patientName} · ${selectedAdmission.admissionNumber}` : 'Admission'} description="Record a payment or complete the discharge process.">
        {selectedAdmission && <div className="space-y-5"><div className="grid grid-cols-2 gap-3"><Input label="Interim payment (₹)" type="number" min="1" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /><div className="flex items-end"><Button className="w-full" variant="outline" onClick={() => paymentMutation.mutate()} isLoading={paymentMutation.isPending} disabled={!paymentAmount}>Record Payment</Button></div></div>{role === 'RECEPTIONIST' && <><label className="block text-sm font-semibold">Discharge summary<textarea required minLength={2} value={dischargeSummary} onChange={(e) => setDischargeSummary(e.target.value)} className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></label><Button className="w-full" variant="primary" onClick={() => dischargeMutation.mutate()} isLoading={dischargeMutation.isPending} disabled={dischargeSummary.trim().length < 2} leftIcon={<LogOut className="h-4 w-4" />}>Discharge Patient</Button></>}</div>}
      </Modal>
    </div>
  );
};
