import type { HabitStats } from '../../core/models/habit';
import { buildWeekGrid, intensity, shareFileName, wrapText } from './share-card';

describe('share card helpers', () => {
  describe('buildWeekGrid', () => {
    // 2026-10-17 is a Saturday, so its week is complete.
    it('ends with the week containing today, Sunday first', () => {
      const grid = buildWeekGrid('2026-10-17', 2, () => 0);
      expect(grid).toHaveLength(2);
      expect(grid[0][0]?.date).toBe('2026-10-04');
      expect(grid[1][0]?.date).toBe('2026-10-11');
      expect(grid[1][6]?.date).toBe('2026-10-17');
    });

    it('leaves days after today empty and flags inactive days', () => {
      // 2026-10-14 is a Wednesday.
      const grid = buildWeekGrid(
        '2026-10-14',
        1,
        (d) => (d === '2026-10-13' ? 4 : 0),
        (d) => d < '2026-10-12',
      );
      const week = grid[0];
      expect(week.slice(4)).toEqual([null, null, null]);
      expect(week[2]).toEqual({ date: '2026-10-13', level: 4, inactive: false });
      expect(week[0]?.inactive).toBe(true);
    });
  });

  it('maps counts to 0–4 intensity levels', () => {
    expect(intensity(0, 5)).toBe(0);
    expect(intensity(1, 8)).toBe(1);
    expect(intensity(4, 8)).toBe(2);
    expect(intensity(8, 8)).toBe(4);
    expect(intensity(3, 0)).toBe(4);
  });

  describe('wrapText', () => {
    // Monospace measure: 1 unit per character.
    const measure = (s: string) => s.length;

    it('wraps on word boundaries', () => {
      expect(wrapText(measure, 'read one page every night', 12, 3)).toEqual([
        'read one',
        'page every',
        'night',
      ]);
    });

    it('ellipsises when the text does not fit in the allowed lines', () => {
      const lines = wrapText(measure, 'read one page every single night', 12, 2);
      expect(lines).toHaveLength(2);
      expect(lines[1].endsWith('…')).toBe(true);
      expect(lines.every((l) => l.length <= 12)).toBe(true);
    });

    it('truncates single words that are too long', () => {
      expect(wrapText(measure, 'supercalifragilistic', 8, 1)).toEqual(['superca…']);
    });
  });

  it('builds safe file names', () => {
    const stats = {} as HabitStats;
    const habit = {
      kind: 'habit' as const,
      date: '2026-10-17',
      name: 'Read 10 pages — before bed!',
      habitKind: 'build' as const,
      icon: 'menu_book',
      color: '#3550D3',
      identity: null,
      startDate: '2026-01-01',
      stats,
      doneDates: new Set<string>(),
    };
    expect(shareFileName(habit)).toBe('atom-read-10-pages-before-bed-2026-10-17.png');
    expect(shareFileName({ ...habit, name: '📚📚' })).toBe('atom-habit-2026-10-17.png');
  });
});
