import { ExportDataButton } from '../../components/shared/ExportDataButton.js';
import { financialSheets } from '../reports/exportData.js';
import { clinicDateAndTime } from '../../utils/clinicTime.js';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, StatCard } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { StatusBadge, Badge } from "../../components/ui/Badge.js";
import {
  CreditCard,
  Search,
  Receipt,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PAYMENT_METHOD_OPTIONS } from './paymentMethods.js';

export const BillingPage: React.FC = () => {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const [payForm, setPayForm] = useState({
    consultationFee: 0,
    additionalFee: 0,
    discount: 0,
    paidAmount: 0,
    paymentMethod: 'CASH',
    transactionReference: '',
  });
  const [paymentError, setPaymentError] = useState('');
  const autoOpenedAppointmentRef = useRef<string | null>(null);
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    if (searchParams.has('appointmentId')) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('appointmentId');
        return next;
      }, { replace: true });
    }
  };

  const { data: payments, isLoading, isError: paymentsError } = useQuery({
    queryKey: ['payments', search, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get('/payments', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const { data: pendingApts, isLoading: pendingLoading, isError: pendingError } = useQuery({
    queryKey: ['pending-payment-apts'],
    queryFn: async () => {
      const res = await apiClient.get('/appointments', {
        params: { date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` },
      });
      return (res.data.data || []).filter(
        (a: any) => a.status === 'COMPLETED' && a.paymentStatus !== 'PAID'
      );
    },
    refetchInterval: 15000,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/payments', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payment-apts'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['reports-doctor-dash'] });
      queryClient.invalidateQueries({ queryKey: ['reception-today'] });
      closePaymentModal();
    },
    onError: (error: any) => {
      setPaymentError(error.response?.data?.error?.message || 'Unable to record payment. Please try again.');
    },
  });

  const openPaymentModal = async (apt: any) => {
    setPaymentError('');
    setSelectedApt(apt);
    // Fetch existing payment for this appointment, if any
    let existingPayment = null;
    try {
      const res = await apiClient.get('/payments', {
        params: { appointmentId: apt.id },
      });
      if (res.data.data.length > 0) {
        existingPayment = res.data.data[0];
      }
    } catch (err) {
      console.error('Failed to fetch existing payment', err);
    }

    const consultationFee = existingPayment ? Number(existingPayment.consultationFee) : apt.consultationFee || 0;
    const additionalFee = existingPayment ? Number(existingPayment.additionalFee) : 0;
    const discount = existingPayment ? Number(existingPayment.discount) : 0;
    const totalAmount = Math.max(0, consultationFee + additionalFee - discount);
    const existingPaidAmount = existingPayment ? Number(existingPayment.paidAmount) : 0;
    const remainingAmount = Math.max(0, totalAmount - existingPaidAmount);

    setPayForm({
      consultationFee,
      additionalFee,
      discount,
      paidAmount: remainingAmount,
      paymentMethod: existingPayment ? existingPayment.paymentMethod : 'CASH',
      transactionReference: existingPayment ? existingPayment.transactionReference || '' : '',
    });

    setSelectedApt((prev: any) => ({
      ...prev,
      _existingPayment: existingPayment,
    }));

    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;

    if (payForm.paidAmount <= 0) {
      setPaymentError('Amount to pay must be greater than zero');
      return;
    }

    setPaymentError('');
    recordPaymentMutation.mutate({
      patientId: selectedApt.patientId,
      appointmentId: selectedApt.id,
      doctorId: selectedApt.doctorId,
      consultationFee: payForm.consultationFee,
      additionalFee: payForm.additionalFee,
      discount: payForm.discount,
      paidAmount: payForm.paidAmount,
      paymentMethod: payForm.paymentMethod,
      transactionReference: payForm.transactionReference || undefined,
    });
  };

  const totalRevenue = payments?.reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0) || 0;
  const totalPending = (pendingApts?.length || 0);

  // Keep the invoice preview; the entered amount is recorded as received.
  const invoiceTotal = Math.max(0, (payForm.consultationFee || 0) + (payForm.additionalFee || 0) - (payForm.discount || 0));

  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    const appointment = pendingApts?.find((item: any) => item.id === appointmentId);
    if (appointment && !isPaymentModalOpen && autoOpenedAppointmentRef.current !== appointmentId) {
      autoOpenedAppointmentRef.current = appointmentId;
      void openPaymentModal(appointment);
    }
  }, [pendingApts, searchParams, isPaymentModalOpen]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Billing & POS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fee collection, payment tracking, and receipt generation
          </p>
        </div>
      </div>

      <ExportDataButton title="Financial Report" context={`Payment filter: ${statusFilter || 'All'} | Search: ${search || 'None'} | Displayed payments and today's awaiting-payment list`} sheets={() => financialSheets(payments || [], pendingApts || [])} filename={`financial-${clinicDateAndTime().date}`} disabled={isLoading || pendingLoading || paymentsError || pendingError} />
      {/* Pending Payments Alert Banner */}
      {totalPending > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-sm font-bold text-amber-900">
                {totalPending} Completed Consultation(s) Awaiting Payment
              </div>
              <div className="text-xs text-amber-700">
                Collect outstanding fees before patients leave
              </div>
            </div>
          </div>
          <button
            className="text-xs font-semibold text-amber-700 underline hover:text-amber-900"
            onClick={() => setStatusFilter("PENDING")}
          >
            View Pending
          </button>
        </div>
      )}

      {/* Pending Payment Queue - Today's Consultations */}
      {pendingApts && pendingApts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Collect Fee — Today's Completed Consultations
            </h2>
          </div>
          <div className="space-y-2">
            {pendingApts.map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    #{apt.tokenNumber} — {apt.patientName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Dr. {apt.doctorName} • Token #{apt.tokenNumber} • ₹
                    {apt.consultationFee}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => openPaymentModal(apt)}
                  leftIcon={<IndianRupee className="w-3.5 h-3.5" />}
                >
                  Collect Fee
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Payment History
            </h2>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select
              aria-label="Payment status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partial</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Consultation</th>
                <th className="p-3">Additional</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Total</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center p-10 text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : payments?.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-10">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                    <p className="text-slate-400">No payment records found</p>
                  </td>
                </tr>
              ) : (
                payments?.map((pay: any) => (
                  <tr
                    key={pay.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">
                        {pay.patientName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {pay.patientNumber}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {pay.doctorName || "—"}
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      ₹{pay.consultationFee?.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono">
                      {pay.additionalFee > 0
                        ? `₹${pay.additionalFee?.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="p-3 font-mono text-emerald-700">
                      {pay.discount > 0 ? `-₹${pay.discount?.toFixed(2)}` : "—"}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ₹{pay.totalAmount?.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700">
                      ₹{pay.paidAmount?.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <Badge variant="default" size="sm">
                        {pay.paymentMethod}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={pay.paymentStatus} size="sm" />
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(pay.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <StatusBadge status={pay.paymentStatus} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        title="Collect Consultation Fee"
        description={
          selectedApt
            ? `Patient: ${selectedApt.patientName} • Doctor: ${selectedApt.doctorName}`
            : ""
        }
        maxWidth="lg"
      >
        {selectedApt && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Consultation Fee (₹)
                </label>
                <p className="text-lg font-semibold text-slate-900">
                  ₹{payForm.consultationFee || 0}
                </p>
              </div>
              <div className="p-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Additional Charges (₹)
                </label>
                <p className="text-lg font-semibold text-slate-900">
                  ₹{payForm.additionalFee || 0}
                </p>
              </div>
            </div>
            <div className="p-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Discount / Concession (₹)
              </label>
              <p className="text-lg font-semibold text-slate-900">
                ₹{payForm.discount || 0}
              </p>
            </div>

            <Input
              label="Discount / Concession (₹)"
              type="number"
              step="0.01"
              value={payForm.discount}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  discount: parseFloat(e.target.value) || 0,
                })
              }
            />

            {/* Total Preview */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-emerald-800">
                <Calculator className="w-4 h-4" />
                <span className="font-semibold">Total Billable Amount:</span>
              </div>
              <span className="text-lg font-black text-emerald-800">
                ₹{invoiceTotal.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Payment Method"
                value={payForm.paymentMethod}
                onChange={(e) =>
                  setPayForm({ ...payForm, paymentMethod: e.target.value })
                }
                options={[...PAYMENT_METHOD_OPTIONS]}
              />
              <Input
                label="Amount to Pay (₹)"
                type="number"
                step="0.01"
                value={payForm.paidAmount}
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    paidAmount: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            {payForm.paymentMethod !== "CASH" && (
              <Input
                label="Transaction Reference / UTR"
                placeholder="e.g. UPI Ref: T123456789"
                value={payForm.transactionReference}
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    transactionReference: e.target.value,
                  })
                }
              />
            )}

            
            {paymentError && (
              <div className="text-xs text-rose-600 font-semibold p-2 bg-rose-50 border border-rose-200 rounded-lg">
                {paymentError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={closePaymentModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                isLoading={recordPaymentMutation.isPending}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Record Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
