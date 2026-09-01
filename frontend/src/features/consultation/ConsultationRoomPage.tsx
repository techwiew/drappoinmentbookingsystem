import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { StatusBadge, Badge } from '../../components/ui/Badge.js';
import { PrescriptionPrinter } from '../../components/shared/PrescriptionPrinter.js';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Save,
  AlertCircle,
  Stethoscope,
  Pill,
  ClipboardList,
  Lock,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ConsultationData {
  id: string;
  chiefComplaint: string;
  symptoms: string;
  diagnosis: string;
  doctorNotes: string;
  testsRecommended: string;
  advice: string;
  nextVisitDate: string;
  followUpNotes: string;
  status: 'DRAFT' | 'COMPLETED';
  prescription?: {
    id: string;
    items: MedicineItem[];
  } | null;
}

export const ConsultationRoomPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { doctorId } = useAuth();

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [rxPrintData, setRxPrintData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [form, setForm] = useState({
    chiefComplaint: '',
    symptoms: '',
    diagnosis: '',
    doctorNotes: '',
    testsRecommended: '',
    advice: '',
    nextVisitDate: '',
    followUpNotes: '',
  });

  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: '' },
  ]);

  const { data: appointment, isLoading: aptLoading } = useQuery({
    queryKey: ['appointment-detail', appointmentId],
    queryFn: async () => {
      const res = await apiClient.get(`/appointments/${appointmentId}`);
      return res.data.data;
    },
    enabled: !!appointmentId,
  });

  const { data: existingConsultation, isLoading: consultLoading } = useQuery<ConsultationData | null>({
    queryKey: ['consultation-for-apt', appointmentId],
    queryFn: async () => {
      const res = await apiClient.get(`/consultations?appointmentId=${appointmentId}`);
      const list = res.data.data;
      return list?.[0] || null;
    },
    enabled: !!appointmentId,
  });

  // Initialize form from fetched data
  useEffect(() => {
    if (existingConsultation && !isInitialized) {
      setIsInitialized(true);
      setForm({
        chiefComplaint: existingConsultation.chiefComplaint || '',
        symptoms: existingConsultation.symptoms || '',
        diagnosis: existingConsultation.diagnosis || '',
        doctorNotes: existingConsultation.doctorNotes || '',
        testsRecommended: existingConsultation.testsRecommended || '',
        advice: existingConsultation.advice || '',
        nextVisitDate: existingConsultation.nextVisitDate
          ? existingConsultation.nextVisitDate.split('T')[0]
          : '',
        followUpNotes: existingConsultation.followUpNotes || '',
      });
      if (existingConsultation.prescription?.items?.length) {
        setMedicines(
          existingConsultation.prescription.items.map((item: any) => ({
            medicineName: item.medicineName,
            dosage: item.dosage || '',
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || '',
          }))
        );
      }
    }
  }, [existingConsultation, isInitialized]);

  const saveMutation = useMutation({
    mutationFn: async (status: 'DRAFT' | 'COMPLETED') => {
      const payload = {
        appointmentId,
        patientId: appointment?.patientId,
        doctorId,
        ...form,
        status,
        medicines: medicines.filter((m) => m.medicineName.trim()),
      };
      if (existingConsultation?.id) {
        const res = await apiClient.put(`/consultations/${existingConsultation.id}`, payload);
        return res.data.data;
      } else {
        const res = await apiClient.post('/consultations', payload);
        return res.data.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-for-apt', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['live-queue'] });
    },
  });

  const isLocked = existingConsultation?.status === 'COMPLETED';

  const addMedicine = () => {
    setMedicines([...medicines, { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: '' }]);
  };

  const removeMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const updateMedicine = (idx: number, field: keyof MedicineItem, value: string) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedicines(updated);
  };

  const handlePrintRx = async () => {
    try {
      const rxId = existingConsultation?.prescription?.id;
      if (rxId) {
        const res = await apiClient.get(`/prescriptions/${rxId}`);
        setRxPrintData(res.data.data);
        setIsPrintOpen(true);
      }
    } catch (e) {}
  };

  const frequencyPresets = ['1-0-0', '0-0-1', '1-0-1', '1-1-1', '0-1-0', 'SOS'];
  const durationPresets = ['1 day', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month'];

  if (aptLoading || consultLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 bg-slate-200 rounded-xl w-1/3" />
        <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/queue')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Queue
          </Button>
          <span className="text-sm font-bold text-slate-900">Consultation Room</span>
          {isLocked && (
            <Badge variant="success" size="sm">
              <Lock className="w-3 h-3 mr-1" /> Completed & Locked
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {existingConsultation?.prescription && (
            <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrintRx}>
              Print Rx
            </Button>
          )}
          {!isLocked && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={saveMutation.isPending}
                onClick={() => saveMutation.mutate('DRAFT')}
              >
                Save Draft
              </Button>
              <Button
                variant="success"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                isLoading={saveMutation.isPending}
                onClick={() => saveMutation.mutate('COMPLETED')}
              >
                Complete & Lock
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Patient Summary */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 text-white border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-bold text-white">Patient Summary</h2>
              <span className="text-xs font-mono bg-white/10 text-slate-300 px-2 py-0.5 rounded ml-auto">
                Token #{appointment?.tokenNumber}
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-bold text-white">{appointment?.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID:</span>
                <span className="font-mono text-slate-200">{appointment?.patientNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Age / Gender:</span>
                <span>{appointment?.patientAge ? `${appointment.patientAge} yrs` : '—'} / {appointment?.patientGender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-rose-300">{appointment?.patientBloodGroup || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visit Type:</span>
                <Badge variant="info" size="sm">{appointment?.appointmentType?.replace(/_/g, ' ')}</Badge>
              </div>
            </div>

            {appointment?.patientAllergies && appointment.patientAllergies !== 'None' && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-2 p-2 bg-rose-500/10 border-rose-400/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-rose-300">⚠️ ALLERGIES</div>
                  <div className="text-rose-200 mt-0.5">{appointment.patientAllergies}</div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Clinical Form */}
        <div className="lg:col-span-3 space-y-4">
          {isLocked && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Consultation completed and locked per clinical protocol.</span>
            </div>
          )}

          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <ClipboardList className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Clinical Notes & Diagnosis</h2>
            </div>
            <div className="space-y-3">
              <Textarea label="Chief Complaint" placeholder="Patient's primary concern..." rows={2} value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} disabled={isLocked} required />
              <Textarea label="Symptoms & Observations" placeholder="Clinical observations..." rows={2} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} disabled={isLocked} />
              <Textarea label="Diagnosis" placeholder="Primary diagnosis with ICD code..." rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} disabled={isLocked} required />
              <Textarea label="Doctor's Notes" placeholder="Internal clinical notes..." rows={2} value={form.doctorNotes} onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })} disabled={isLocked} />
              <Textarea label="Tests Recommended" placeholder="CBC, LFT, ECG..." rows={2} value={form.testsRecommended} onChange={(e) => setForm({ ...form, testsRecommended: e.target.value })} disabled={isLocked} />
              <Textarea label="General Advice" placeholder="Diet, activity restrictions..." rows={2} value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })} disabled={isLocked} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Next Visit Date" type="date" value={form.nextVisitDate} onChange={(e) => setForm({ ...form, nextVisitDate: e.target.value })} disabled={isLocked} />
                <Input label="Follow-up Notes" placeholder="Review BP, repeat ECG..." value={form.followUpNotes} onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })} disabled={isLocked} />
              </div>
            </div>
          </Card>

          {/* Prescription Builder */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Prescription Builder</h2>
                <span className="text-xs text-slate-400">({medicines.filter(m => m.medicineName).length} medicines)</span>
              </div>
              {!isLocked && (
                <Button size="sm" variant="success" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addMedicine}>
                  Add Medicine
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                      <span className="text-xs font-semibold text-slate-600">Medicine #{idx + 1}</span>
                    </div>
                    {!isLocked && medicines.length > 1 && (
                      <button type="button" onClick={() => removeMedicine(idx)} className="text-rose-400 hover:text-rose-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Medicine Name / Brand" placeholder="e.g. Amoxicillin 500mg" value={med.medicineName} onChange={(e) => updateMedicine(idx, 'medicineName', e.target.value)} disabled={isLocked} />
                    <Input label="Dosage" placeholder="e.g. 500 mg" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} disabled={isLocked} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Frequency (M-A-N)</label>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {frequencyPresets.map((f) => (
                          <button key={f} type="button" disabled={isLocked} onClick={() => updateMedicine(idx, 'frequency', f)}
                            className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-all ${med.frequency === f ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                      <Input placeholder="Custom: e.g. 1-1-0" value={med.frequency} onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)} disabled={isLocked} className="text-xs font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Duration</label>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {durationPresets.map((d) => (
                          <button key={d} type="button" disabled={isLocked} onClick={() => updateMedicine(idx, 'duration', d)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-all ${med.duration === d ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                      <Input placeholder="e.g. 7 days" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} disabled={isLocked} className="text-xs" />
                    </div>
                  </div>

                  <Input label="Special Instructions" placeholder="e.g. Take with food..." value={med.instructions} onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)} disabled={isLocked} className="text-xs" />
                </div>
              ))}
            </div>

            {!isLocked && (
              <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100 justify-end">
                <Button variant="secondary" size="sm" isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate('DRAFT')} leftIcon={<Save className="w-3.5 h-3.5" />}>
                  Save Draft
                </Button>
                <Button variant="success" size="sm" isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate('COMPLETED')} leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  Complete & Lock
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <PrescriptionPrinter isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} data={rxPrintData} />
    </div>
  );
};
