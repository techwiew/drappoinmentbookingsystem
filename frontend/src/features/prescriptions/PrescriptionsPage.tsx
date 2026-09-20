import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { downloadPrescriptionPdf, foodTimingLabel, printPrescription, type PrescriptionDetail } from './prescriptionDocument.js';
import {
  FileText,
  Search,
  Calendar,
  Stethoscope,
  Clock,
  User,
  Pill,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

export const PrescriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, doctorId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<PrescriptionDetail['items']>([]);
  const [actionError, setActionError] = useState('');

  const { data: selected, isLoading: detailLoading } = useQuery<PrescriptionDetail>({
    queryKey: ['prescription-detail', selectedId],
    queryFn: async () => (await apiClient.get(`/prescriptions/${selectedId}`)).data.data,
    enabled: Boolean(selectedId),
  });
  useEffect(() => { if (selected) setDraftItems(selected.items.map((item) => ({ ...item }))); }, [selected]);
  const updateMutation = useMutation({
    mutationFn: async () => (await apiClient.patch(`/prescriptions/${selectedId}`, { items: draftItems })).data.data,
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['prescriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['prescription-detail', selectedId] });
    },
    onError: (error: any) => setActionError(error.response?.data?.error?.message || 'Unable to update prescription.'),
  });

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['prescriptions-list', search],
    queryFn: async () => {
      const res = await apiClient.get('/consultations');
      return (res.data.data || []).filter((c: any) => c.prescription);
    },
  });

  const filtered = (consultations || []).filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.patientName?.toLowerCase().includes(q) ||
      c.patientNumber?.toLowerCase().includes(q) ||
      c.diagnosis?.toLowerCase().includes(q) ||
      c.doctorName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            Prescriptions Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search and view doctor prescriptions and medication orders
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, patient ID, doctor, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </Card>

      {/* Prescriptions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-28 bg-white rounded-xl border border-slate-200"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">No prescriptions found</p>
          <p className="text-xs text-slate-400 mt-1">
            Prescriptions appear here after consultations are completed.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c: any) => (
            <Card
              key={c.id}
              className="flex flex-col justify-between hover:border-brand-200 transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900">
                      {c.patientName}
                    </span>
                    <span className="ml-2 text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {c.patientNumber}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 mb-2">
                  <span className="font-semibold text-slate-700">
                    Diagnosis:{" "}
                  </span>
                  {c.diagnosis}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>🩺 Dr. {c.doctorName}</span>
                  <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>

                {c.prescription?.items?.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs">
                    <div className="text-[11px] text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Pill className="w-3 h-3 text-emerald-500" />
                      <span>
                        {c.prescription.items.length} Medications Prescribed:
                      </span>
                    </div>
                    <div className="space-y-1">
                      {c.prescription.items
                        .slice(0, 3)
                        .map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-slate-700 flex items-center gap-2"
                          >
                            <span className="font-medium">
                              {item.medicineName}
                            </span>
                            <span className="font-mono text-brand-600 text-[11px]">
                              ({item.frequency})
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              • {item.duration}
                            </span>
                          </div>
                        ))}
                      {c.prescription.items.length > 3 && (
                        <div className="text-[10px] text-slate-400 italic">
                          +{c.prescription.items.length - 3} more items...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {c.nextVisitDate && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-brand-700 bg-brand-50/50 px-2 py-1 rounded">
                  Follow-up: {new Date(c.nextVisitDate).toLocaleDateString()}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Button size="sm" variant="outline" onClick={() => { setSelectedId(c.prescription.id); setEditing(false); setActionError(''); }}>View / Print / Download</Button>
                {role === 'DOCTOR' && c.doctorId === doctorId && <Button size="sm" variant="outline" onClick={() => { setSelectedId(c.prescription.id); setEditing(true); setActionError(''); }}>Edit</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal isOpen={Boolean(selectedId)} onClose={() => { setSelectedId(null); setEditing(false); }} title={editing ? 'Edit prescription' : 'Prescription details'}>
        {detailLoading || !selected ? <p>Loading prescription...</p> : <div className="space-y-4 text-sm">
          <div><strong>{selected.clinic.name}</strong><p>{selected.clinic.address}</p><p>{selected.clinic.phone}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p><b>Patient:</b> {selected.patient.fullName} ({selected.patient.patientNumber})</p><p><b>Doctor:</b> Dr. {selected.doctor.name}</p><p><b>Date:</b> {new Date(selected.prescribedAt).toLocaleDateString()}</p><p><b>Diagnosis:</b> {selected.diagnosis || '—'}</p></div>
          <div className="space-y-3">{(editing ? draftItems : selected.items).map((item, index) => <div key={index} className="rounded-lg border p-3 space-y-2">
            {editing ? <>
              {(['medicineName', 'dosage', 'frequency', 'duration', 'instructions'] as const).map((field) => <label key={field} className="block text-xs capitalize">{field}<input className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={item[field] || ''} onChange={(event) => setDraftItems((current) => current.map((entry, i) => i === index ? { ...entry, [field]: event.target.value } : entry))} /></label>)}
              <label className="block text-xs">Food timing<select className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={item.foodTiming || 'NO_PREFERENCE'} onChange={(event) => setDraftItems((current) => current.map((entry, i) => i === index ? { ...entry, foodTiming: event.target.value } : entry))}><option value="NO_PREFERENCE">No preference</option><option value="BEFORE_FOOD">Before food</option><option value="AFTER_FOOD">After food</option><option value="WITH_FOOD">With food</option></select></label>
              <Button size="sm" variant="danger" onClick={() => setDraftItems((current) => current.filter((_, i) => i !== index))}>Remove medicine</Button>
            </> : <><strong>{item.medicineName}</strong><p>{item.dosage} · {item.frequency} · {item.duration} · {foodTimingLabel(item.foodTiming)}</p>{item.instructions && <p>{item.instructions}</p>}</>}
          </div>)}</div>
          {actionError && <p role="alert" className="text-rose-700">{actionError}</p>}
          <div className="flex flex-wrap gap-2">{editing ? <><Button size="sm" variant="outline" onClick={() => setDraftItems((items) => [...items, { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', foodTiming: 'NO_PREFERENCE', instructions: '' }])}>Add medicine</Button><Button size="sm" variant="primary" disabled={!draftItems.length || draftItems.some((item) => !item.medicineName.trim())} isLoading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save changes</Button></> : <><Button size="sm" variant="outline" onClick={() => { try { printPrescription(selected); } catch (error) { setActionError((error as Error).message); } }}>Print</Button><Button size="sm" variant="primary" onClick={() => void downloadPrescriptionPdf(selected).catch(() => setActionError('Unable to download PDF.'))}>Download PDF</Button>{role === 'DOCTOR' && selected.doctor.id === doctorId && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>}</>}</div>
        </div>}
      </Modal>
    </div>
  );
};
