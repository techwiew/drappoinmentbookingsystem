import { describe, expect, it } from 'vitest';
import { clinicDateAndTime, isClinicAppointmentTimeInPast } from './clinicTime.js';

describe('clinic appointment clock', () => {
  it('uses the India clinic day and accepts the current minute', () => {
    const now = new Date('2026-09-18T08:30:42.000Z');
    expect(clinicDateAndTime(now)).toEqual({ date: '2026-09-18', time: '14:00' });
    expect(isClinicAppointmentTimeInPast('2026-09-18', '14:00', now)).toBe(false);
    expect(isClinicAppointmentTimeInPast('2026-09-18', '13:59', now)).toBe(true);
    expect(isClinicAppointmentTimeInPast('2026-09-19', '09:00', now)).toBe(false);
  });
});
