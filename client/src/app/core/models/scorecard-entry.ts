export type Rating = 'positive' | 'negative' | 'neutral';

/** A line on the Habits Scorecard. */
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
