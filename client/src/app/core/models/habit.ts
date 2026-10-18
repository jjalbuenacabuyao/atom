import type { IdentityRef } from './identity';

export type HabitKind = 'build' | 'break';

/** Progress computed by the server as of the user's local date. */
export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalVotes: number;
  completionRate: number;
  scheduledToday: boolean;
  completedToday: boolean;
  missedLast: boolean;
  neverMissTwice: boolean;
  compound: number;
}

/** A habit to build or break, designed around the Four Laws. */
export interface Habit {
  id: string;
  name: string;
  kind: HabitKind;
  identity: IdentityRef | null;
  cueTime: string;
  cueLocation: string;
  stackAfter: string;
  obviousNote: string;
  attractiveNote: string;
  easyNote: string;
  satisfyingNote: string;
  scheduleDays: number;
  color: string;
  icon: string;
  position: number;
  startDate: string;
  archivedAt: string | null;
  createdAt: string;
  stats: HabitStats;
}

export interface HabitInput {
  name: string;
  kind: HabitKind;
  identityId: string | null;
  cueTime: string;
  cueLocation: string;
  stackAfter: string;
  obviousNote: string;
  attractiveNote: string;
  easyNote: string;
  satisfyingNote: string;
  scheduleDays: number;
  color: string;
  icon: string;
  startDate: string;
}
