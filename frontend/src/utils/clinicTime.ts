const CLINIC_TIME_ZONE = 'Asia/Kolkata';

export const clinicDateAndTime = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return { date: `${value('year')}-${value('month')}-${value('day')}`, time: `${value('hour')}:${value('minute')}` };
};

export const isClinicAppointmentTimeInPast = (date: string, time: string, now = new Date()) => {
  if (!time) return false;
  const current = clinicDateAndTime(now);
  return `${date}T${time}` < `${current.date}T${current.time}`;
};
