import type { Habit } from './habit';
import type { Identity } from './identity';

/** Number of completions on a date. */
export interface DayCount {
  date: string;
  count: number;
}

/** The user's daily overview. */
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
