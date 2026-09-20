import { apiClient } from './client.js';

export const fetchAppointmentsForDate = async (date: string, filters: Record<string, string> = {}) => {
  const appointments: any[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await apiClient.get('/appointments', { params: { ...filters, date, page, limit: 100 } });
    appointments.push(...response.data.data);
    totalPages = response.data.meta?.totalPages || 1;
    page++;
  } while (page <= totalPages);
  return appointments;
};
