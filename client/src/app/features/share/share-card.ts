import { parseIsoDate, toIsoDate } from '../../core/dates';
import type { DayCount, HabitKind, HabitStats } from '../../core/models';

/**
 * Renders shareable progress images on a <canvas>. Everything happens in the
 * browser: no data leaves the device until the user downloads or shares it.
 * Colours come from the app's Material 3 tokens so the card matches the theme.
 */

export type ShareFormat = 'square' | 'story';
export type ShareTheme = 'light' | 'dark';

export const SHARE_FORMATS: Record<ShareFormat, { width: number; height: number; label: string }> =
  {
    square: { width: 1080, height: 1080, label: 'Square' },
    story: { width: 1080, height: 1920, label: 'Story' },
  };

export interface HabitShareCard {
  kind: 'habit';
  /** The user's local date (YYYY-MM-DD). */
  date: string;
  name: string;
  habitKind: HabitKind;
  icon: string;
  color: string;
  identity: string | null;
  startDate: string;
  stats: HabitStats;
  doneDates: ReadonlySet<string>;
}

export interface OverviewShareCard {
  kind: 'overview';
  date: string;
  userName: string;
  completed: number;
  scheduled: number;
  totalVotes: number;
  bestStreak: number;
  habitCount: number;
  identities: readonly { statement: string; votes: number }[];
  activity: readonly DayCount[];
}

export type ShareCard = HabitShareCard | OverviewShareCard;

/* ------------------------------------------------------------------------ */
/* Pure helpers (unit tested)                                                */
/* ------------------------------------------------------------------------ */

export interface GridDay {
  date: string;
  /** 0 = nothing logged, 1–4 = intensity. */
  level: number;
  /** Days before the habit started. */
  inactive: boolean;
}

/**
 * Builds `weeks` columns (oldest first) of 7 days (Sunday first) ending with
 * the week containing `today`. Days after today are `null`.
 */
export function buildWeekGrid(
  today: string,
  weeks: number,
  level: (date: string) => number,
  isInactive: (date: string) => boolean = () => false,
): (GridDay | null)[][] {
  const end = parseIsoDate(today);
  const start = new Date(end);
  start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7);
  const columns: (GridDay | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: (GridDay | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const date = toIsoDate(day);
      column.push(date > today ? null : { date, level: level(date), inactive: isInactive(date) });
    }
    columns.push(column);
  }
  return columns;
}

/** Maps a count to a 0–4 intensity level relative to the maximum. */
export function intensity(count: number, max: number): number {
  if (count <= 0) return 0;
  return Math.max(1, Math.min(4, Math.ceil((count / Math.max(1, max)) * 4)));
}

/**
 * Greedy word wrap. Lines beyond `maxLines` are dropped and the last line is
 * ellipsised; single words wider than the line are truncated.
 */
export function wrapText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || measure(candidate) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  // Shortens `s` until `s…` fits.
  const ellipsize = (s: string) => {
    let out = s;
    while (out.length > 1 && measure(`${out}…`) > maxWidth) out = out.slice(0, -1).trimEnd();
    return `${out}…`;
  };
  const truncate = (s: string) => (measure(s) <= maxWidth ? s : ellipsize(s));

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines).map(truncate);
    // Text continues past the last line, so it always gets an ellipsis.
    kept[maxLines - 1] = ellipsize(lines[maxLines - 1]);
    return kept;
  }
  return lines.map(truncate);
}

/** File name such as `atom-read-before-bed-2026-10-17.png`. */
export function shareFileName(card: ShareCard): string {
  const base = card.kind === 'habit' ? card.name : 'progress';
  const slug =
    base
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/, '') || 'habit';
  return `atom-${slug}-${card.date}.png`;
}
