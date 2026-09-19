const TWELVE_HOUR_TIME_REGEX = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i;
const TWENTY_FOUR_HOUR_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const CLINIC_TIME_ZONE = 'Asia/Kolkata';

const clinicClockParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return { dateKey: `${value('year')}-${value('month')}-${value('day')}`, hour: Number(value('hour')), minute: Number(value('minute')) };
};

export const clinicDateKey = (date: Date): string => clinicClockParts(date).dateKey;

export const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Prisma stores appointmentDate and nextVisitDate as SQL DATE values.
// Query those dates at UTC midnight so local timezone offsets cannot shift the day.
export const dateOnlyRange = (dateKey: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || Number.isNaN(Date.parse(`${dateKey}T00:00:00.000Z`))) {
    throw { statusCode: 400, code: 'INVALID_DATE', message: 'Date must use YYYY-MM-DD format' };
  }
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
};

const formatTwelveHourTime = (hours: number, minutes: string) => {
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours.toString().padStart(2, '0')}:${minutes} ${meridiem}`;
};

export const isValidAppointmentTime = (value: string) => {
  const rawValue = value?.trim();
  if (!rawValue) {
    return false;
  }

  return (
    TWELVE_HOUR_TIME_REGEX.test(rawValue) ||
    TWENTY_FOUR_HOUR_TIME_REGEX.test(rawValue)
  );
};

export const normalizeAppointmentTime = (value?: string | null) => {
  const rawValue = value?.trim();

  if (!rawValue) {
    return getCurrentAppointmentTime();
  }

  const twentyFourHourMatch = rawValue.match(TWENTY_FOUR_HOUR_TIME_REGEX);
  if (twentyFourHourMatch) {
    const [, hours, minutes] = twentyFourHourMatch;
    return formatTwelveHourTime(Number(hours), minutes);
  }

  const twelveHourMatch = rawValue.match(TWELVE_HOUR_TIME_REGEX);
  if (twelveHourMatch) {
    const [, hours, minutes, meridiem] = twelveHourMatch;
    const normalizedHours = Number(hours);
    return `${normalizedHours.toString().padStart(2, '0')}:${minutes} ${meridiem.toUpperCase()}`;
  }

  throw {
    statusCode: 400,
    code: 'INVALID_APPOINTMENT_TIME',
    message: 'Appointment time must be a valid time in HH:MM or HH:MM AM/PM format',
  };
};

export const getCurrentAppointmentTime = (minutesFromNow = 0) => {
  const now = new Date(Date.now() + minutesFromNow * 60 * 1000);
  if (minutesFromNow > 0 && now.getSeconds() > 0) now.setMinutes(now.getMinutes() + 1);
  const { hour, minute } = clinicClockParts(now);
  return formatTwelveHourTime(hour, minute.toString().padStart(2, '0'));
};

/** Appointment inputs have minute precision, so the current minute is still bookable. */
export const isAppointmentSlotInPast = (dateKey: string, time: string, now = new Date()): boolean => {
  const normalized = normalizeAppointmentTime(time);
  const [, hoursText, minutesText, meridiem] = normalized.match(/^(\d{2}):(\d{2}) (AM|PM)$/)!;
  const hours = Number(hoursText) % 12 + (meridiem === 'PM' ? 12 : 0);
  const current = clinicClockParts(now);
  const scheduledKey = `${dateKey}T${String(hours).padStart(2, '0')}:${minutesText}`;
  const currentKey = `${current.dateKey}T${String(current.hour).padStart(2, '0')}:${String(current.minute).padStart(2, '0')}`;
  return scheduledKey < currentKey;
};
