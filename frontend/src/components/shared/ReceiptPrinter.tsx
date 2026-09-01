import React from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Printer, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../ui/Badge.js';

interface ReceiptPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="flex justify-end gap-2 pb-3 mb-4 border-b border-slate-100 no-print">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
          Print Invoice / Receipt
        </Button>
      </div>

      {/* Printable Receipt Layout */}
      <div className="printable-area bg-white p-6 font-sans text-slate-800 border border-slate-200 rounded-xl shadow-xs">
        <div className="text-center border-b pb-4">
          <h2 className="text-lg font-bold text-slate-900">{data.clinic?.name}</h2>
          <p className="text-xs text-slate-500">{data.clinic?.address}</p>
          <p className="text-xs text-slate-500">Phone: {data.clinic?.phone}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-0.5 rounded-full">
            <span>OFFICIAL PAYMENT RECEIPT</span>
          </div>
        </div>

        <div className="flex justify-between py-3 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Receipt No:</span>
            <span className="font-mono font-bold text-slate-800">{data.receiptNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Date & Time:</span>
            <span className="text-slate-700">
              {data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>
        </div>

        <div className="py-3 border-b border-slate-100 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-400 block">Billed To:</span>
            <span className="font-bold text-slate-800">{data.patient?.fullName}</span>
            <span className="text-slate-500 block">ID: {data.patient?.patientNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Consulting Doctor:</span>
            <span className="font-semibold text-slate-800">{data.doctor?.name || 'Clinic Staff'}</span>
            {data.appointmentToken && (
              <span className="text-slate-500 block">Token #: {data.appointmentToken}</span>
            )}
          </div>
        </div>

        {/* Itemized charges table */}
        <div className="py-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold text-left">
                <th className="pb-1.5">Description</th>
                <th className="pb-1.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 text-slate-800">Doctor Consultation Fee</td>
                <td className="py-2 text-right font-mono">₹{data.consultationFee?.toFixed(2)}</td>
              </tr>
              {data.additionalFee > 0 && (
                <tr>
                  <td className="py-2 text-slate-800">Additional Procedures / Tests</td>
                  <td className="py-2 text-right font-mono">₹{data.additionalFee?.toFixed(2)}</td>
                </tr>
              )}
              {data.discount > 0 && (
                <tr>
                  <td className="py-2 text-emerald-700 font-medium">Promotional Discount</td>
                  <td className="py-2 text-right font-mono text-emerald-700">-₹{data.discount?.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Ledger */}
        <div className="border-t-2 border-slate-800 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between font-bold text-sm text-slate-900">
            <span>Total Billable Amount:</span>
            <span className="font-mono">₹{data.totalAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Amount Paid ({data.paymentMethod}):</span>
            <span className="font-mono font-bold text-emerald-700">₹{data.paidAmount?.toFixed(2)}</span>
          </div>
          {data.pendingAmount > 0 && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Balance Pending:</span>
              <span className="font-mono">₹{data.pendingAmount?.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Status: <strong className="text-slate-800">{data.paymentStatus}</strong></span>
          </div>
          {data.transactionReference && (
            <span className="font-mono">Ref: {data.transactionReference}</span>
          )}
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-2">
          Thank you for visiting! Please retain this receipt for your records.
        </div>
      </div>
    </Modal>
  );
};
