/** Calendar-date helpers. Dates travel to the API as local `YYYY-MM-DD`. */

const pad = (n: number) => String(n).padStart(2, '0');

/** Formats a Date as a local calendar date string (YYYY-MM-DD). */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local calendar date. */
export function today(): string {
  return toIsoDate(new Date());
}

/** Parses a YYYY-MM-DD string as a local date at midnight. */
export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Adds a number of days to a YYYY-MM-DD string. */
export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export const WEEKDAYS = [
  { bit: 1 << 0, short: 'S', label: 'Sunday' },
  { bit: 1 << 1, short: 'M', label: 'Monday' },
  { bit: 1 << 2, short: 'T', label: 'Tuesday' },
  { bit: 1 << 3, short: 'W', label: 'Wednesday' },
  { bit: 1 << 4, short: 'T', label: 'Thursday' },
  { bit: 1 << 5, short: 'F', label: 'Friday' },
  { bit: 1 << 6, short: 'S', label: 'Saturday' },
] as const;

export const EVERY_DAY = 0b1111111;
export const WEEKDAYS_ONLY = 0b0111110;

/** Whether a weekday mask includes the given date. */
export function isScheduled(mask: number, date: string): boolean {
  return (mask & (1 << parseIsoDate(date).getDay())) !== 0;
}

/** Human-readable summary of a weekday mask. */
export function describeSchedule(mask: number): string {
  if (mask === EVERY_DAY) return 'Every day';
  if (mask === WEEKDAYS_ONLY) return 'Weekdays';
  if (mask === 0b1000001) return 'Weekends';
  return WEEKDAYS.filter((d) => mask & d.bit)
    .map((d) => d.label.slice(0, 3))
    .join(', ');
}

/** Formats a 24h `HH:MM` time for display in the user's locale. */
export function formatTime(value: string): string {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
