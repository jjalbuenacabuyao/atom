import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { formatTime } from '../../core/dates';
import type { Habit } from '../../core/models';
import { lowerFirst } from '../../core/text';
import { HabitAvatar } from '../../shared/habit-avatar';
import { shapeCss, shapePath } from '../../shared/shapes';

/** A habit in the daily checklist with its cue, streak and check button. */
@Component({
  selector: 'app-habit-row',
  imports: [RouterLink, MatIconModule, MatTooltipModule, HabitAvatar],
  templateUrl: './habit-row.html',
  styleUrl: './habit-row.scss',
  host: {
    role: 'listitem',
    '[class.done]': 'habit().stats.completedToday',
    '[style.--habit-color]': 'habit().color',
  },
})
export class HabitRow {
  readonly habit = input.required<Habit>();
  readonly pending = input(false);
  readonly toggled = output<Habit>();

  /** The implementation intention, e.g. "After I pour coffee · at 7:00 AM · in the kitchen". */
  protected readonly cue = computed(() => {
    const h = this.habit();
    const parts: string[] = [];
    if (h.stackAfter) parts.push(`After ${lowerFirst(h.stackAfter)}`);
    if (h.cueTime) parts.push(`at ${formatTime(h.cueTime)}`);
    if (h.cueLocation) parts.push(`in ${h.cueLocation}`);
    return parts.join(' · ');
  });

  /** The check morphs from an outlined circle into a filled cookie shape. */
  protected readonly checkPath = computed(() =>
    shapePath(this.habit().stats.completedToday ? 'sunny' : 'circle'),
  );
  protected readonly checkCss = computed(() =>
    shapeCss(this.habit().stats.completedToday ? 'sunny' : 'circle'),
  );

  protected readonly label = computed(() => {
    const h = this.habit();
    if (h.stats.completedToday) return `Undo ${h.name}`;
    return h.kind === 'break' ? `Mark ${h.name} as resisted` : `Complete ${h.name}`;
  });
}
