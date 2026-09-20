import React from 'react';
import { Card } from '../ui/Card.js';
import { StatusBadge } from '../ui/Badge.js';
import { OpenConsultationButton } from './OpenConsultationButton.js';

export const AppointmentList: React.FC<{ appointments: any[]; title: string }> = ({ appointments, title }) => <Card>
  <h2 className="text-sm font-bold text-slate-900 mb-3">{title} ({appointments.length})</h2>
  {!appointments.length && <p className="text-sm text-slate-500">No appointments for this date.</p>}
  <div className="divide-y divide-slate-100 max-h-96 overflow-auto">
    {appointments.map((appointment) => <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div><div className="text-sm font-semibold">#{appointment.tokenNumber} {appointment.patientName}</div><div className="text-xs text-slate-500">{appointment.appointmentTime || 'Time to confirm'} · {appointment.doctorName}</div></div>
      <div className="flex items-center gap-3"><StatusBadge status={appointment.status} size="sm" /><OpenConsultationButton patientId={appointment.patientId} appointment={appointment} /></div>
    </div>)}
  </div>
</Card>;
