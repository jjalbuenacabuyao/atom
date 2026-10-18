import { HABIT_COLORS, HABIT_ICONS } from './habit-options';
import {
  applyTemplate,
  FIELD_SUGGESTIONS,
  HABIT_TEMPLATES,
  TemplateTarget,
  TIME_SUGGESTIONS,
} from './habit-suggestions';

const blank: TemplateTarget & { scheduleDays: number; startDate: string } = {
  name: '',
  kind: 'build',
  identityId: '',
  newIdentity: '',
  cueTime: '',
  cueLocation: '',
  stackAfter: '',
  obviousNote: '',
  attractiveNote: '',
  easyNote: '',
  satisfyingNote: '',
  color: '#3550D3',
  icon: 'bolt',
  scheduleDays: 62,
  startDate: '2026-10-18',
};

describe('habit suggestions', () => {
  const read = HABIT_TEMPLATES.find((t) => t.name === 'Read before bed')!;

  describe('applyTemplate', () => {
    it('fills the plan and proposes a new identity', () => {
      const result = applyTemplate(blank, read, []);
      expect(result.name).toBe('Read before bed');
      expect(result.easyNote).toBe('Read one page');
      expect(result.newIdentity).toBe('I am a reader');
      expect(result.identityId).toBe('');
    });

    it('selects an existing identity instead of duplicating it', () => {
      const result = applyTemplate(blank, read, [{ id: 'i1', statement: ' i am a READER ' }]);
      expect(result.identityId).toBe('i1');
      expect(result.newIdentity).toBe('');
    });

    it('keeps fields the template does not cover', () => {
      const result = applyTemplate(blank, read, []);
      expect(result.scheduleDays).toBe(62);
      expect(result.startDate).toBe('2026-10-18');
    });

    it('switches the habit kind to the template kind', () => {
      const breakTemplate = HABIT_TEMPLATES.find((t) => t.kind === 'break')!;
      expect(applyTemplate(blank, breakTemplate, []).kind).toBe('break');
    });
  });

  describe('content', () => {
    it('only uses colours and icons the editor can show', () => {
      for (const t of HABIT_TEMPLATES) {
        expect(HABIT_COLORS).toContain(t.color);
        expect(HABIT_ICONS).toContain(t.icon);
      }
    });

    it('fits the API validation limits', () => {
      for (const t of HABIT_TEMPLATES) {
        expect(t.name.length).toBeLessThanOrEqual(120);
        expect(t.identity.length).toBeLessThanOrEqual(160);
        expect(t.cueLocation.length).toBeLessThanOrEqual(200);
        expect(t.stackAfter.length).toBeLessThanOrEqual(200);
        expect(t.cueTime).toMatch(/^$|^([01]\d|2[0-3]):[0-5]\d$/);
      }
      for (const time of TIME_SUGGESTIONS) expect(time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    });

    it('offers templates and suggestions for both kinds of habit', () => {
      for (const kind of ['build', 'break'] as const) {
        expect(HABIT_TEMPLATES.filter((t) => t.kind === kind).length).toBeGreaterThan(2);
        expect(FIELD_SUGGESTIONS[kind].name.length).toBeGreaterThan(2);
      }
    });

    it('does not suggest habit stacking for habits to break', () => {
      expect(FIELD_SUGGESTIONS.break.stackAfter).toEqual([]);
      for (const t of HABIT_TEMPLATES.filter((t) => t.kind === 'break')) {
        expect(t.stackAfter).toBe('');
      }
    });
  });
});
