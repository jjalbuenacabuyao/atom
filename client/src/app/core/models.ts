/** API contracts shared with the Go backend (see server/internal/dto). */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  name: string;
}

export type HabitKind = 'build' | 'break';

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

export interface IdentityRef {
  id: string;
  statement: string;
}

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

export interface HabitLog {
  date: string;
  note: string;
}

export interface Identity {
  id: string;
  statement: string;
  description: string;
  votes: number;
  habitCount: number;
  createdAt: string;
}

export interface IdentityInput {
  statement: string;
  description: string;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface Dashboard {
  date: string;
  habits: Habit[];
  scheduledCount: number;
  completedCount: number;
  totalVotes: number;
  bestStreak: number;
  identities: Identity[];
  activity: DayCount[];
}

export type Rating = 'positive' | 'negative' | 'neutral';

export interface ScorecardEntry {
  id: string;
  description: string;
  rating: Rating;
  timeOfDay: string;
  position: number;
}

export interface ScorecardInput {
  description: string;
  rating: Rating;
  timeOfDay: string;
}

/** Error envelope returned by the API. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
