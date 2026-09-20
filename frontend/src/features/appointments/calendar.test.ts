import { describe, expect, it } from 'vitest';
import { calendarDates, layoutAppointments, shiftDate, timeMinutes } from './calendar.js';

describe('appointment calendar', () => {
  it('handles midnight, noon and both stored time formats', () => {
    expect(timeMinutes('12:00 AM')).toBe(0);
    expect(timeMinutes('12:00 PM')).toBe(720);
    expect(timeMinutes('02:15 PM')).toBe(855);
    expect(timeMinutes('14:15')).toBe(855);
    expect(timeMinutes(null)).toBeNull();
    expect(timeMinutes('24:10')).toBeNull();
  });
  it('starts weeks on Monday and crosses month and year boundaries', () => {
    expect(calendarDates('2026-09-20', true)).toEqual(['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20']);
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(calendarDates('2026-09-20', false)).toEqual(['2026-09-20']);
  });
  it('lays out overlapping appointments in separate lanes and reuses free space', () => {
    const entries = layoutAppointments([
      { id: 'a', appointmentTime: '09:00 AM' }, { id: 'b', appointmentTime: '09:15 AM' },
      { id: 'c', appointmentTime: '09:30 AM' }, { id: 'd', appointmentTime: '10:00 AM' },
      { id: 'e', appointmentTime: null },
    ]);
    expect(entries.map(({ lane, lanes }) => [lane, lanes])).toEqual([[0, 2], [1, 2], [0, 2], [0, 1]]);
    expect(entries[0].start).toBe(540);
  });
});
