import type { HabitKind } from '../../core/models/habit';

/**
 * Example content for the habit designer: complete starter templates and
 * per-field suggestions, each tailored to building or breaking a habit.
 */

/** A complete Four Laws plan the user can start from. */
export interface HabitTemplate {
  kind: HabitKind;
  name: string;
  icon: string;
  color: string;
  identity: string;
  cueTime: string;
  cueLocation: string;
  stackAfter: string;
  obviousNote: string;
  attractiveNote: string;
  easyNote: string;
  satisfyingNote: string;
}

export const HABIT_TEMPLATES: readonly HabitTemplate[] = [
  {
    kind: 'build',
    name: 'Read before bed',
    icon: 'menu_book',
    color: '#3550D3',
    identity: 'I am a reader',
    cueTime: '21:30',
    cueLocation: 'bed',
    stackAfter: 'I get into bed',
    obviousNote: 'Leave a book on my pillow every morning',
    attractiveNote: 'Make a cup of herbal tea that I only drink while reading',
    easyNote: 'Read one page',
    satisfyingNote: 'Check it off in Atom and note one idea I liked',
  },
  {
    kind: 'build',
    name: 'Go for a run',
    icon: 'directions_run',
    color: '#2E8B57',
    identity: 'I am a runner',
    cueTime: '07:00',
    cueLocation: 'the park',
    stackAfter: 'I finish my morning coffee',
    obviousNote: 'Lay out my running clothes the night before',
    attractiveNote: 'Only listen to my favourite podcast while running',
    easyNote: 'Put on my running shoes and step outside',
    satisfyingNote: 'Log the run and enjoy a smoothie afterwards',
  },
  {
    kind: 'build',
    name: 'Meditate',
    icon: 'self_improvement',
    color: '#7B4BC9',
    identity: 'I am a calm, present person',
    cueTime: '07:30',
    cueLocation: 'the living room',
    stackAfter: 'I pour my morning coffee',
    obviousNote: 'Keep a cushion in the corner of the living room',
    attractiveNote: 'Use a guided session with a voice I enjoy',
    easyNote: 'Sit down and take three slow breaths',
    satisfyingNote: 'Check it off and notice how I feel',
  },
  {
    kind: 'build',
    name: 'Drink a glass of water',
    icon: 'water_drop',
    color: '#0277BD',
    identity: 'I am someone who takes care of my body',
    cueTime: '09:00',
    cueLocation: 'my desk',
    stackAfter: 'I sit down at my desk',
    obviousNote: 'Keep a full bottle on my desk',
    attractiveNote: 'Add lemon or mint to make it taste better',
    easyNote: 'Fill my glass and take one sip',
    satisfyingNote: 'Track each glass in Atom',
  },
  {
    kind: 'build',
    name: 'Write in my journal',
    icon: 'edit_note',
    color: '#C2417F',
    identity: 'I am a writer',
    cueTime: '22:00',
    cueLocation: 'the kitchen table',
    stackAfter: 'I finish dinner',
    obviousNote: 'Leave my journal and pen on the kitchen table',
    attractiveNote: 'Write with my favourite pen and a candle lit',
    easyNote: 'Write one sentence about my day',
    satisfyingNote: 'Reread an old entry once a week',
  },
  {
    kind: 'break',
    name: 'Scroll social media in bed',
    icon: 'phone_iphone',
    color: '#E07B00',
    identity: 'I am in control of my attention',
    cueTime: '23:00',
    cueLocation: 'bed',
    stackAfter: '',
    obviousNote: 'Charge my phone outside the bedroom',
    attractiveNote: 'Remember how rested I feel on nights without it',
    easyNote: 'Log out of social apps and remove them from my home screen',
    satisfyingNote: 'Tell an accountability partner each time I slip',
  },
  {
    kind: 'break',
    name: 'Snack late at night',
    icon: 'nutrition',
    color: '#D9483B',
    identity: 'I am a healthy eater',
    cueTime: '22:30',
    cueLocation: 'the kitchen',
    stackAfter: '',
    obviousNote: 'Keep snacks out of sight in a high cupboard',
    attractiveNote: 'Focus on how much better I sleep without it',
    easyNote: 'Brush my teeth right after dinner',
    satisfyingNote: 'Put money in a jar each time I slip',
  },
  {
    kind: 'break',
    name: 'Impulse buying',
    icon: 'savings',
    color: '#B8920A',
    identity: 'I am someone who spends with intention',
    cueTime: '',
    cueLocation: 'online shops',
    stackAfter: '',
    obviousNote: 'Unsubscribe from shopping newsletters',
    attractiveNote: 'Picture what the money will be worth in savings',
    easyNote: 'Wait 48 hours before buying anything non-essential',
    satisfyingNote: 'Move the money I did not spend into savings',
  },
  {
    kind: 'break',
    name: 'Hit snooze',
    icon: 'bedtime',
    color: '#546E7A',
    identity: 'I am an early riser',
    cueTime: '06:30',
    cueLocation: 'bed',
    stackAfter: '',
    obviousNote: 'Put my alarm across the room',
    attractiveNote: 'Plan something I look forward to first thing',
    easyNote: 'Go to bed 30 minutes earlier',
    satisfyingNote: 'Track every snooze-free morning in Atom',
  },
];

/** Form fields that offer suggestion chips. */
export type SuggestedField =
  | 'name'
  | 'identity'
  | 'cueLocation'
  | 'stackAfter'
  | 'obviousNote'
  | 'attractiveNote'
  | 'easyNote'
  | 'satisfyingNote';

export const FIELD_SUGGESTIONS: Record<HabitKind, Record<SuggestedField, readonly string[]>> = {
  build: {
    name: [
      'Read 10 pages',
      'Meditate',
      'Go for a walk',
      'Stretch for 5 minutes',
      'Practise a language',
    ],
    identity: ['I am a reader', 'I am an athlete', 'I am a writer', 'I am a lifelong learner'],
    cueLocation: ['the kitchen', 'my desk', 'the living room', 'bed', 'the gym'],
    stackAfter: [
      'I pour my morning coffee',
      'I brush my teeth',
      'I sit down at my desk',
      'I finish dinner',
      'I get into bed',
    ],
    obviousNote: [
      'Put what I need where I will see it',
      'Lay everything out the night before',
      'Set a reminder for the cue time',
    ],
    attractiveNote: [
      'Only listen to my favourite podcast while doing it',
      'Do it together with a friend',
      'Pair it with my morning coffee',
    ],
    easyNote: [
      'Do just the first two minutes',
      'Prepare everything in advance',
      'Start with the smallest possible version',
    ],
    satisfyingNote: [
      'Check it off in Atom right away',
      'Enjoy a small treat afterwards',
      'Share my streak with a friend',
    ],
  },
  break: {
    name: [
      'Scroll social media in bed',
      'Snack late at night',
      'Hit snooze',
      'Check email first thing',
      'Bite my nails',
    ],
    identity: [
      'I am in control of my attention',
      'I am a healthy eater',
      'I am an early riser',
      'I am a non-smoker',
    ],
    cueLocation: ['bed', 'the kitchen', 'my desk', 'the sofa', 'online shops'],
    stackAfter: [],
    obviousNote: [
      'Keep it out of sight',
      'Move the trigger to another room',
      'Unfollow or unsubscribe from the trigger',
    ],
    attractiveNote: [
      'List the benefits of stopping',
      'Remember how I feel afterwards',
      'Spend time with people who do not do it',
    ],
    easyNote: [
      'Add a step that makes it harder',
      'Remove the app or item entirely',
      'Use a commitment device',
    ],
    satisfyingNote: [
      'Find an accountability partner',
      'Put money in a jar each time I slip',
      'Track my clean days in Atom',
    ],
  },
};

/** Common cue times, as 24h `HH:MM`. */
export const TIME_SUGGESTIONS: readonly string[] = ['07:00', '12:30', '18:00', '21:30'];

/** The template-related fields of the habit form. */
export interface TemplateTarget {
  name: string;
  kind: HabitKind;
  identityId: string;
  newIdentity: string;
  cueTime: string;
  cueLocation: string;
  stackAfter: string;
  obviousNote: string;
  attractiveNote: string;
  easyNote: string;
  satisfyingNote: string;
  color: string;
  icon: string;
}

/**
 * Returns the form model with a template applied. An existing identity with the
 * same statement is selected; otherwise the template's identity is proposed as
 * a new one. Fields outside the template (schedule, start date) are kept.
 */
export function applyTemplate<M extends TemplateTarget>(
  model: M,
  template: HabitTemplate,
  identities: readonly { id: string; statement: string }[],
): M {
  const key = template.identity.trim().toLowerCase();
  const existing = identities.find((i) => i.statement.trim().toLowerCase() === key);
  return {
    ...model,
    kind: template.kind,
    name: template.name,
    icon: template.icon,
    color: template.color,
    identityId: existing?.id ?? '',
    newIdentity: existing ? '' : template.identity,
    cueTime: template.cueTime,
    cueLocation: template.cueLocation,
    stackAfter: template.stackAfter,
    obviousNote: template.obviousNote,
    attractiveNote: template.attractiveNote,
    easyNote: template.easyNote,
    satisfyingNote: template.satisfyingNote,
  };
}
