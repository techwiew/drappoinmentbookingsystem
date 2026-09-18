import { describe, expect, it } from 'vitest';
import { dateOnlyRange, localDateKey } from '../utils/time.js';

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
});
