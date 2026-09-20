import { timeMinutes } from './calendar.js';

type DisplayAppointment = {
  id: string;
  status: string;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  tokenNumber?: number | null;
};

const statusRank = (status: string) => {
  if (status === 'COMPLETED') return 2;
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 1;
  return 0;
};

export const sortAppointmentsForDisplay = <T extends DisplayAppointment>(appointments: T[]): T[] =>
  [...appointments].sort((a, b) =>
    statusRank(a.status) - statusRank(b.status) ||
    String(b.appointmentDate || '').slice(0, 10).localeCompare(String(a.appointmentDate || '').slice(0, 10)) ||
    (timeMinutes(b.appointmentTime) ?? -1) - (timeMinutes(a.appointmentTime) ?? -1) ||
    Number(b.tokenNumber || 0) - Number(a.tokenNumber || 0) ||
    a.id.localeCompare(b.id)
  );
