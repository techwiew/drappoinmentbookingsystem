import { describe, expect, it, vi } from 'vitest';
vi.mock('./client.js', () => ({ apiClient: { get: vi.fn() } }));
import { apiClient } from './client.js';
import { fetchAppointmentsForDate } from './appointments.js';

describe('calendar appointment loading', () => {
  it('loads subsequent pages so a busy day does not silently lose appointments', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [{ id: 'first' }], meta: { totalPages: 2 } } });
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [{ id: 'last' }], meta: { totalPages: 2 } } });
    expect(await fetchAppointmentsForDate('2026-09-20', { doctorId: 'doctor' })).toEqual([{ id: 'first' }, { id: 'last' }]);
    expect(apiClient.get).toHaveBeenLastCalledWith('/appointments', { params: { date: '2026-09-20', doctorId: 'doctor', page: 2, limit: 100 } });
  });
});
