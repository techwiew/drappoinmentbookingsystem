export const shiftDate = (date: string, days: number): string => {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

export const calendarDates = (date: string, week: boolean): string[] => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const start = week ? shiftDate(date, -((weekday + 6) % 7)) : date;
  return Array.from({ length: week ? 7 : 1 }, (_, index) => shiftDate(start, index));
};

export const timeMinutes = (time?: string | null): number | null => {
  const match = time?.trim().match(/^(\d{1,2}):([0-5]\d)(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  if (match[3]) {
    if (hours < 1 || hours > 12) return null;
    hours = hours % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  } else if (hours > 23) return null;
  return hours * 60 + Number(match[2]);
};

// Appointments have a start time but no duration field. Reserve 30 visual minutes.
export const layoutAppointments = <T extends { id: string; appointmentTime?: string | null }>(appointments: T[]) => {
  const sorted = appointments.flatMap((appointment) => {
    const start = timeMinutes(appointment.appointmentTime);
    return start === null ? [] : [{ appointment, start, end: Math.min(start + 30, 1440), lane: 0, lanes: 1 }];
  }).sort((a, b) => a.start - b.start || a.appointment.id.localeCompare(b.appointment.id));
  let group: typeof sorted = [];
  let ends: number[] = [];
  const finish = () => group.forEach((item) => { item.lanes = ends.length; });
  for (const item of sorted) {
    if (group.length && item.start >= Math.max(...ends)) { finish(); group = []; ends = []; }
    let lane = ends.findIndex((end) => end <= item.start);
    if (lane === -1) lane = ends.length;
    ends[lane] = item.end;
    item.lane = lane;
    group.push(item);
  }
  finish();
  return sorted;
};
