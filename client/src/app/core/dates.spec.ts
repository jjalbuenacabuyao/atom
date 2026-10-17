import {
  addDays,
  describeSchedule,
  EVERY_DAY,
  isScheduled,
  parseIsoDate,
  toIsoDate,
  WEEKDAYS_ONLY,
} from './dates';

describe('dates', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('round-trips through parseIsoDate', () => {
    expect(toIsoDate(parseIsoDate('2026-10-17'))).toBe('2026-10-17');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('checks weekday masks', () => {
    // 2026-10-17 is a Saturday.
    expect(isScheduled(EVERY_DAY, '2026-10-17')).toBe(true);
    expect(isScheduled(WEEKDAYS_ONLY, '2026-10-17')).toBe(false);
    expect(isScheduled(WEEKDAYS_ONLY, '2026-10-19')).toBe(true);
  });

  it('describes schedules', () => {
    expect(describeSchedule(EVERY_DAY)).toBe('Every day');
    expect(describeSchedule(WEEKDAYS_ONLY)).toBe('Weekdays');
    expect(describeSchedule(0b1000001)).toBe('Weekends');
    expect(describeSchedule(0b0010101)).toBe('Sun, Tue, Thu');
  });
});
