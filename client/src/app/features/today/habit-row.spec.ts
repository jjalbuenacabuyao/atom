import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Habit } from '../../core/models/habit';
import { HabitRow } from './habit-row';

const habit: Habit = {
  id: 'h1',
  name: 'Read',
  kind: 'build',
  identity: null,
  cueTime: '21:30',
  cueLocation: 'bed',
  stackAfter: 'I brush my teeth',
  obviousNote: '',
  attractiveNote: '',
  easyNote: 'Read one page',
  satisfyingNote: '',
  scheduleDays: 127,
  color: '#3550D3',
  icon: 'menu_book',
  position: 0,
  startDate: '2026-10-01',
  archivedAt: null,
  createdAt: '',
  stats: {
    currentStreak: 4,
    longestStreak: 9,
    totalVotes: 12,
    completionRate: 0.8,
    scheduledToday: true,
    completedToday: false,
    missedLast: false,
    neverMissTwice: false,
    compound: 1.13,
  },
};

describe('HabitRow', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('shows the implementation intention and two-minute version', async () => {
    const fixture = TestBed.createComponent(HabitRow);
    fixture.componentRef.setInput('habit', habit);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('After I brush my teeth');
    expect(text).toContain('in bed');
    expect(text).toContain('Read one page');
  });

  it('emits when the check button is pressed', async () => {
    const fixture = TestBed.createComponent(HabitRow);
    fixture.componentRef.setInput('habit', habit);
    const emitted: Habit[] = [];
    fixture.componentInstance.toggled.subscribe((h) => emitted.push(h));
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button.check') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Complete Read');
    button.click();
    expect(emitted).toEqual([habit]);
  });

  it('disables the button while a request is pending', async () => {
    const fixture = TestBed.createComponent(HabitRow);
    fixture.componentRef.setInput('habit', habit);
    fixture.componentRef.setInput('pending', true);
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('button.check') as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
