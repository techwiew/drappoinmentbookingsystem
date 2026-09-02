const TWELVE_HOUR_TIME_REGEX = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i;
const TWENTY_FOUR_HOUR_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

export const getCurrentAppointmentTime = () => {
  const now = new Date();
  return formatTwelveHourTime(now.getHours(), now.getMinutes().toString().padStart(2, '0'));
};
