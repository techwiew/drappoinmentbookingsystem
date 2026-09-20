import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { StatusBadge } from '../../components/ui/Badge.js';
import { OpenConsultationButton } from '../../components/shared/OpenConsultationButton.js';
import { clinicDateAndTime } from '../../utils/clinicTime.js';
import { layoutAppointments, timeMinutes } from './calendar.js';

export const AppointmentCalendar: React.FC<{ dates: string[]; appointments: any[]; loading: boolean }> = ({ dates, appointments, loading }) => {
  const [selected, setSelected] = useState<any>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const now = clinicDateAndTime();
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = 7 * 96; }, []);
  const untimed = appointments.filter((appointment) => timeMinutes(appointment.appointmentTime) === null);
  return <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden" aria-label="Appointment calendar">
    <div className="px-4 py-3 border-b text-xs text-slate-500 flex justify-between gap-3"><span>India Standard Time (IST) · 30-minute display slots</span><span>{loading ? 'Loading schedule…' : `${appointments.length} appointments`}</span></div>
    {!!untimed.length && <div className="border-b p-3 bg-amber-50 text-xs"><strong>Time to confirm</strong><div className="flex flex-wrap gap-2 mt-2">{untimed.map((appointment) => <button key={appointment.id} className="rounded border border-amber-200 bg-white px-3 py-2" onClick={() => setSelected(appointment)}>{appointment.patientName} · {appointment.appointmentDate.slice(0, 10)}</button>)}</div></div>}
    <div ref={scroller} className="overflow-auto max-h-[680px]">
      <div style={{ minWidth: dates.length > 1 ? 1050 : 480 }}>
        <div className="sticky top-0 z-20 grid bg-white border-b shadow-sm" style={{ gridTemplateColumns: `64px repeat(${dates.length}, minmax(0, 1fr))` }}>
          <div className="p-3 text-xs text-slate-400">IST</div>
          {dates.map((date) => <div key={date} className={`p-3 border-l text-center ${date === now.date ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}><div className="text-xs font-semibold">{new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })}</div><div className="font-bold text-lg">{date.slice(8)}</div></div>)}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(${dates.length}, minmax(0, 1fr))` }}>
          <div className="relative text-[11px] text-slate-400" style={{ height: 2304 }}>{Array.from({ length: 24 }, (_, hour) => <div key={hour} className="absolute right-2" style={{ top: hour * 96 + 4 }}>{String(hour).padStart(2, '0')}:00</div>)}</div>
          {dates.map((date) => <div key={date} className={`relative border-l ${date === now.date ? 'bg-indigo-50/20' : ''}`} style={{ height: 2304, backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 47px, #e2e8f0 47px, #e2e8f0 48px)' }}>
            {layoutAppointments(appointments.filter((appointment) => appointment.appointmentDate.slice(0, 10) === date)).map(({ appointment, start, end, lane, lanes }) => <button key={appointment.id} onClick={() => setSelected(appointment)} title={`${appointment.appointmentTime} · ${appointment.patientName} · ${appointment.doctorName} · ${appointment.status.replace(/_/g, ' ')}`} className={`absolute overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm focus:z-10 focus:outline focus:outline-2 focus:outline-indigo-600 ${appointment.status === 'COMPLETED' ? 'bg-emerald-100 border-emerald-600 text-emerald-950' : ['CANCELLED', 'NO_SHOW'].includes(appointment.status) ? 'bg-slate-100 border-slate-400 text-slate-500' : 'bg-indigo-100 border-indigo-600 text-indigo-950'}`} style={{ top: start * 1.6, height: Math.max((end - start) * 1.6 - 2, 20), left: `calc(${lane * 100 / lanes}% + 3px)`, width: `calc(${100 / lanes}% - 6px)` }}><div className="font-bold truncate">{appointment.appointmentTime} · {appointment.patientName}</div><div className="truncate">{appointment.doctorName} · {appointment.status.replace(/_/g, ' ')}</div></button>)}
            {date === now.date && <div className="absolute z-10 left-0 right-0 border-t-2 border-rose-500 pointer-events-none" style={{ top: (timeMinutes(now.time) || 0) * 1.6 }} aria-label="Current time" />}
          </div>)}
        </div>
      </div>
    </div>
    {!loading && !appointments.length && <p className="p-4 text-sm text-slate-500">No appointments match this schedule and filters.</p>}
    <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Appointment details" maxWidth="sm">
      {selected && <div className="space-y-3 text-sm"><h3 className="font-bold text-lg">{selected.patientName}</h3><p>{selected.doctorName}</p><p>{selected.appointmentDate.slice(0, 10)} · {selected.appointmentTime || 'Time to confirm'} (IST)</p><StatusBadge status={selected.status} /><p>{selected.reasonForVisit}</p><OpenConsultationButton patientId={selected.patientId} appointment={selected} /></div>}
    </Modal>
  </section>;
};
