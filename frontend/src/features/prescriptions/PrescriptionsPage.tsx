import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { PrescriptionPrinter } from '../../components/shared/PrescriptionPrinter.js';
import {
  FileText,
  Search,
  Printer,
  Calendar,
  Stethoscope,
  Clock,
  User,
  Pill,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrescriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['prescriptions-list', search],
    queryFn: async () => {
      const res = await apiClient.get('/consultations');
      return (res.data.data || []).filter((c: any) => c.prescription);
    },
  });

  const handleOpenPrint = async (rxId: string) => {
    try {
      const res = await apiClient.get(`/prescriptions/${rxId}`);
      setSelectedRx(res.data.data);
      setIsPrintOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

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
            Search, view, and print formal doctor prescriptions and medication orders
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
            <div key={i} className="animate-pulse h-28 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">No prescriptions found</p>
          <p className="text-xs text-slate-400 mt-1">Prescriptions appear here after consultations are completed.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c: any) => (
            <Card key={c.id} className="flex flex-col justify-between hover:border-brand-200 transition-all">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900">{c.patientName}</span>
                    <span className="ml-2 text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {c.patientNumber}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenPrint(c.prescription.id)}
                  >
                    Print Rx
                  </Button>
                </div>

                <div className="text-xs text-slate-600 mb-2">
                  <span className="font-semibold text-slate-700">Diagnosis: </span>
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
                      <span>{c.prescription.items.length} Medications Prescribed:</span>
                    </div>
                    <div className="space-y-1">
                      {c.prescription.items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="text-slate-700 flex items-center gap-2">
                          <span className="font-medium">{item.medicineName}</span>
                          <span className="font-mono text-brand-600 text-[11px]">({item.frequency})</span>
                          <span className="text-slate-400 text-[11px]">• {item.duration}</span>
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
            </Card>
          ))}
        </div>
      )}

      {/* Prescription Print Modal */}
      <PrescriptionPrinter
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        data={selectedRx}
      />
    </div>
  );
};
