import { describe, expect, it } from 'vitest';
import { sortAppointmentsForDisplay } from './appointmentDisplayOrder.js';

describe('appointment display order', () => {
  it('shows active appointments newest first and completed last', () => {
    const appointments = [
      { id: 'done', status: 'COMPLETED', appointmentDate: '2026-09-20', appointmentTime: '03:00 PM', tokenNumber: 6 },
      { id: 'morning', status: 'WAITING', appointmentDate: '2026-09-20', appointmentTime: '09:00 AM', tokenNumber: 1 },
      { id: 'afternoon', status: 'READY_FOR_DOCTOR', appointmentDate: '2026-09-20', appointmentTime: '01:00 PM', tokenNumber: 4 },
      { id: 'same-time-high-token', status: 'IN_CONSULTATION', appointmentDate: '2026-09-20', appointmentTime: '01:00 PM', tokenNumber: 5 },
      { id: 'cancelled', status: 'CANCELLED', appointmentDate: '2026-09-20', appointmentTime: '04:00 PM', tokenNumber: 7 },
      { id: 'next-day', status: 'BOOKED', appointmentDate: '2026-09-21', appointmentTime: '08:00 AM', tokenNumber: 1 },
    ];
    expect(sortAppointmentsForDisplay(appointments).map((appointment) => appointment.id)).toEqual([
      'next-day', 'same-time-high-token', 'afternoon', 'morning', 'cancelled', 'done',
    ]);
    expect(appointments[0].id).toBe('done');
  });
});
