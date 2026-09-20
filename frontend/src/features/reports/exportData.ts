import type { ExportSheet } from '../../utils/exportWorkbook.js';
import { clinicDateAndTime } from '../../utils/clinicTime.js';

const currency = '"₹" #,##0.00;[Red]("₹" #,##0.00)';
export const excelDate = (value: string) => value ? new Date(`${clinicDateAndTime(new Date(value)).date}T00:00:00Z`) : null;

export const financialSheets = (payments: any[], pending: any[]): ExportSheet[] => [{
  name: 'Financial',
  columns: [
    { header: 'Patient', width: 28 }, { header: 'Patient ID' }, { header: 'Doctor', width: 26 },
    ...['Consultation Fee', 'Additional Fee', 'Discount', 'Total Amount', 'Paid Amount', 'Outstanding'].map((header) => ({ header, format: currency, total: true })),
    { header: 'Payment Method' }, { header: 'Status', width: 24 }, { header: 'Date (IST)', format: 'dd mmm yyyy' },
  ],
  rows: payments.map((payment) => [payment.patientName, payment.patientNumber, payment.doctorName || '', ...['consultationFee', 'additionalFee', 'discount', 'totalAmount', 'paidAmount', 'pendingAmount'].map((key) => Number(payment[key] || 0)), payment.paymentMethod, payment.paymentStatus, excelDate(payment.createdAt)]),
}, {
  name: 'Awaiting Payment Today',
  columns: [{ header: 'Patient', width: 28 }, { header: 'Patient ID' }, { header: 'Doctor', width: 26 }, { header: 'Date', format: 'dd mmm yyyy' }, { header: 'Time' }, { header: 'Payment Status' }],
  rows: pending.map((appointment) => [appointment.patientName, appointment.patientNumber, appointment.doctorName, excelDate(appointment.appointmentDate), appointment.appointmentTime || '', appointment.paymentStatus]),
}];

export const reportSheets = (data: any): ExportSheet[] => {
  const kpis = data.kpis || {};
  return [{
    name: 'Clinical Summary',
    columns: [{ header: 'Metric', width: 36 }, { header: 'Count', format: '#,##0' }],
    rows: [['Total Bookings', kpis.totalToday ?? 0], ['Completed Consultations', kpis.completedCount ?? 0], ['New Patients', kpis.newPatientsCount ?? 0], ['Returning Patients', kpis.returningPatientsCount ?? 0], ['Follow-ups', kpis.followUpsCount ?? 0], ['No Shows', kpis.noShowCount ?? 0]],
  }, {
    name: 'Financial Summary',
    columns: [{ header: 'Metric', width: 36 }, { header: 'Amount (INR)', format: currency }],
    rows: [['OPD Collected on Selected Date', kpis.todayCollection ?? 0], ['IPD Collected on Selected Date (Clinic)', kpis.todayIpdCollection ?? 0], ['Total Collected on Selected Date', Number(kpis.todayCollection || 0) + Number(kpis.todayIpdCollection || 0)]],
  }, {
    name: 'IPD Collections',
    columns: [{ header: 'Date', format: 'dd mmm yyyy', width: 26 }, { header: 'Revenue (INR)', format: currency, total: true, width: 26 }],
    rows: (data.ipdRevenueTrends || []).map((entry: any) => [new Date(`${entry.date}T00:00:00Z`), Number(entry.revenue)]),
  }];
};
