import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { parseIsoDate, today } from '../../core/dates';
import { HabitsService } from '../../core/habits.service';
import type { Dashboard, Habit } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { Heatmap } from '../../shared/heatmap';
import { ProgressRing } from '../../shared/progress-ring';
import { LoadingIndicator } from '../../shared/loading-indicator';
import { ShareService } from '../share/share.service';
import { HabitRow } from './habit-row';

@Component({
  selector: 'app-today',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    HabitRow,
    Heatmap,
    ProgressRing,
    LoadingIndicator,
  ],
  templateUrl: './today.html',
  styleUrl: './today.scss',
})
export class Today {
  private readonly habitsApi = inject(HabitsService);
  private readonly notify = inject(NotifyService);
  private readonly auth = inject(AuthService);
  private readonly shareService = inject(ShareService);
  protected readonly firstName = this.auth.firstName;

  protected readonly date = signal(today());
  protected readonly dashboard = httpResource<Dashboard>(() =>
    this.habitsApi.urls.dashboard(this.date()),
  );
  /** IDs of habits with a check-in request in flight. */
  protected readonly pending = signal<ReadonlySet<string>>(new Set());

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return this.firstName() ? `${part}, ${this.firstName()}` : part;
  });

  protected readonly longDate = computed(() =>
    parseIsoDate(this.date()).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  );

  protected readonly data = computed(() =>
    this.dashboard.hasValue() ? this.dashboard.value() : undefined,
  );
  protected readonly dueToday = computed(
    () => this.data()?.habits.filter((h) => h.stats.scheduledToday) ?? [],
  );
  protected readonly notDueToday = computed(
    () => this.data()?.habits.filter((h) => !h.stats.scheduledToday) ?? [],
  );
  protected readonly atRisk = computed(() => this.dueToday().filter((h) => h.stats.neverMissTwice));
  protected readonly progress = computed(() => {
    const d = this.data();
    return d && d.scheduledCount > 0 ? d.completedCount / d.scheduledCount : 0;
  });
  protected readonly allDone = computed(() => {
    const d = this.data();
    return !!d && d.scheduledCount > 0 && d.completedCount === d.scheduledCount;
  });

  protected share(): void {
    const d = this.data();
    if (d) void this.shareService.shareProgress(d, this.auth.user()?.name ?? '');
  }

  protected async toggle(habit: Habit): Promise<void> {
    if (this.pending().has(habit.id)) return;
    const done = habit.stats.completedToday;
    this.setPending(habit.id, true);
    try {
      if (done) {
        await firstValueFrom(this.habitsApi.uncheck(habit.id, this.date()));
      } else {
        await firstValueFrom(this.habitsApi.check(habit.id, this.date()));
        this.celebrate(habit);
      }
      this.dashboard.reload();
    } catch (err) {
      this.notify.error(err);
    } finally {
      this.setPending(habit.id, false);
    }
  }

  private celebrate(habit: Habit): void {
    const streak = habit.stats.currentStreak + 1;
    const vote = habit.identity ? ` for “${habit.identity.statement}”` : '';
    const message =
      habit.kind === 'break'
        ? `Resisted! Vote cast${vote}.`
        : `Vote cast${vote}. ${streak}-day streak!`;
    this.notify.info(message);
  }

  private setPending(id: string, on: boolean): void {
    this.pending.update((set) => {
      const next = new Set(set);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
