import type { HabitKind } from '../../core/models/habit';

export const HABIT_COLORS = [
  '#3550D3',
  '#7B4BC9',
  '#C2417F',
  '#D9483B',
  '#E07B00',
  '#B8920A',
  '#2E8B57',
  '#00897B',
  '#0277BD',
  '#546E7A',
] as const;

export const HABIT_ICONS = [
  'bolt',
  'menu_book',
  'fitness_center',
  'self_improvement',
  'directions_run',
  'water_drop',
  'bedtime',
  'edit_note',
  'restaurant',
  'nutrition',
  'savings',
  'code',
  'music_note',
  'brush',
  'language',
  'psychology',
  'smoke_free',
  'phone_iphone',
  'no_drinks',
  'favorite',
] as const;

interface LawCopy {
  title: string;
  subtitle: string;
  prompt: string;
  placeholder: string;
}

/**
 * Copy for the Four Laws of Behavior Change, and their inversions for
 * breaking a bad habit.
 */
export const LAWS: Record<
  HabitKind,
  Record<'obvious' | 'attractive' | 'easy' | 'satisfying', LawCopy>
> = {
  build: {
    obvious: {
      title: 'Make it obvious',
      subtitle: 'Cue',
      prompt: 'How will you design your environment so the cue is impossible to miss?',
      placeholder: 'Leave the book on my pillow every morning',
    },
    attractive: {
      title: 'Make it attractive',
      subtitle: 'Craving',
      prompt:
        'Temptation bundling: pair it with something you want. “After I [habit], I will [thing I want].”',
      placeholder: 'Only listen to my favourite podcast while I exercise',
    },
    easy: {
      title: 'Make it easy',
      subtitle: 'Response',
      prompt:
        'The two-minute rule: what is the version of this habit that takes under two minutes?',
      placeholder: 'Read one page',
    },
    satisfying: {
      title: 'Make it satisfying',
      subtitle: 'Reward',
      prompt: 'What immediate reward will you give yourself? (Checking it off in Atom counts!)',
      placeholder: 'Make my favourite tea afterwards',
    },
  },
  break: {
    obvious: {
      title: 'Make it invisible',
      subtitle: 'Cue',
      prompt: 'How will you reduce exposure to the cues that trigger this habit?',
      placeholder: 'Leave my phone in another room after 9pm',
    },
    attractive: {
      title: 'Make it unattractive',
      subtitle: 'Craving',
      prompt: 'Reframe your mindset: what are the benefits of avoiding this habit?',
      placeholder: 'I sleep better and wake up with more energy',
    },
    easy: {
      title: 'Make it difficult',
      subtitle: 'Response',
      prompt: 'Increase friction: how can you add steps between you and the habit?',
      placeholder: 'Log out of social apps and delete them from my home screen',
    },
    satisfying: {
      title: 'Make it unsatisfying',
      subtitle: 'Reward',
      prompt: 'Who is your accountability partner, or what is the cost of slipping up?',
      placeholder: 'Text my partner every time I slip',
    },
  },
};
