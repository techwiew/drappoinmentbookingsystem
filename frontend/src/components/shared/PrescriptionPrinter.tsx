import React from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Printer, Stethoscope } from 'lucide-react';

interface PrescriptionPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const PrescriptionPrinter: React.FC<PrescriptionPrinterProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      <div className="flex justify-end gap-2 pb-3 mb-4 border-b border-slate-100 no-print">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
          Print Prescription
        </Button>
      </div>

      {/* Printable Clinical Sheet */}
      <div className="printable-area bg-white p-6 font-sans text-slate-800">
        {/* Clinic Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {data.clinic?.name || 'Sharma Healthcare & Polyclinic'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">{data.clinic?.address}</p>
            <p className="text-xs text-slate-600">
              Phone: {data.clinic?.phone} • Email: {data.clinic?.email}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 font-bold text-xs rounded border border-brand-200">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>MEDICAL PRESCRIPTION</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Date: {data.prescribedAt ? new Date(data.prescribedAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Doctor & Patient Information Strip */}
        <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 bg-slate-50 px-3 rounded-lg my-3 text-xs">
          <div>
            <div className="font-bold text-slate-900 text-sm">{data.doctor?.name}</div>
            <div className="text-slate-600">{data.doctor?.specialization}</div>
            <div className="text-slate-500 font-mono">Reg #: {data.doctor?.registrationNumber}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-900 text-sm">{data.patient?.fullName}</div>
            <div className="text-slate-600">
              ID: <span className="font-mono">{data.patient?.patientNumber}</span> • {data.patient?.gender} • {data.patient?.age} yrs
            </div>
            <div className="text-rose-600 font-medium">
              Allergies: {data.patient?.allergies || 'None Reported'}
            </div>
          </div>
        </div>

        {/* Clinical Summary */}
        <div className="space-y-3 my-4">
          {data.diagnosis && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Primary Diagnosis
              </span>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                {data.diagnosis}
              </div>
            </div>
          )}

          {/* Rx Symbol & Medication Table */}
          <div className="pt-2">
            <div className="text-2xl font-serif font-black text-slate-900 mb-2">
              ℞
            </div>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2 border-r border-slate-200">#</th>
                  <th className="p-2 border-r border-slate-200">Medicine Name</th>
                  <th className="p-2 border-r border-slate-200">Dosage</th>
                  <th className="p-2 border-r border-slate-200">Frequency</th>
                  <th className="p-2 border-r border-slate-200">Duration</th>
                  <th className="p-2">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 font-mono border-r border-slate-200 text-slate-500">{idx + 1}</td>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{item.medicineName}</td>
                    <td className="p-2 border-r border-slate-200">{item.dosage || '—'}</td>
                    <td className="p-2 font-mono font-semibold border-r border-slate-200 text-brand-700">{item.frequency}</td>
                    <td className="p-2 border-r border-slate-200">{item.duration}</td>
                    <td className="p-2 text-slate-600">{item.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clinical Advice */}
          {data.advice && (
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                General Advice & Lifestyle Recommendations
              </span>
              <p className="text-xs text-slate-700 mt-1 whitespace-pre-line">{data.advice}</p>
            </div>
          )}

          {data.nextVisitDate && (
            <div className="p-2.5 bg-brand-50/60 border border-brand-200/80 rounded-lg text-xs flex items-center justify-between">
              <span className="font-semibold text-brand-900">Next Follow-Up Date:</span>
              <span className="font-bold text-brand-800">
                {new Date(data.nextVisitDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Doctor Signature Area */}
        <div className="pt-12 flex justify-end">
          <div className="text-center w-48 border-t border-slate-400 pt-1">
            <div className="text-xs font-bold text-slate-900">{data.doctor?.name}</div>
            <div className="text-[10px] text-slate-500">Authorized Signature & Seal</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
