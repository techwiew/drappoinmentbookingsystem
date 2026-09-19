import { describe, expect, it } from 'vitest';
import { clinicDateKey, dateOnlyRange, isAppointmentSlotInPast, localDateKey } from '../utils/time.js';

describe('SQL date boundaries', () => {
  it('uses the local calendar day for dashboard dates', () => {
    expect(localDateKey(new Date(2026, 8, 18, 23, 30))).toBe('2026-09-18');
  });

  it('queries DATE columns at UTC midnight without moving the calendar day', () => {
    const range = dateOnlyRange('2026-09-18');
    expect(range.gte.toISOString()).toBe('2026-09-18T00:00:00.000Z');
    expect(range.lt.toISOString()).toBe('2026-09-19T00:00:00.000Z');
  });

  it('rejects an invalid queue date with a client error', () => {
    expect(() => dateOnlyRange('18-09-2026')).toThrow();
  });

  it('includes a same-day 2 PM appointment in the live queue date range', () => {
    const appointmentDate = new Date('2026-09-18T00:00:00.000Z');
    const range = dateOnlyRange('2026-09-18');
    expect(appointmentDate >= range.gte && appointmentDate < range.lt).toBe(true);
  });

  it('accepts the current minute and rejects an earlier minute', () => {
    const now = new Date('2026-09-18T08:30:42.000Z'); // 14:00 in the clinic
    expect(clinicDateKey(now)).toBe('2026-09-18');
    expect(clinicDateKey(new Date('2026-09-18T19:00:00.000Z'))).toBe('2026-09-19');
    expect(isAppointmentSlotInPast('2026-09-18', '14:00', now)).toBe(false);
    expect(isAppointmentSlotInPast('2026-09-18', '13:59', now)).toBe(true);
    expect(isAppointmentSlotInPast('2026-09-19', '09:00', now)).toBe(false);
  });
});
