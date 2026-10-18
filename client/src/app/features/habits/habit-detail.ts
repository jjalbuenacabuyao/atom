import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  addDays,
  describeSchedule,
  formatTime,
  isScheduled,
  parseIsoDate,
  today,
} from '../../core/dates';
import { HabitsApi } from '../../core/habits-api';
import type { DayCount } from '../../core/models/dashboard';
import type { Habit } from '../../core/models/habit';
import type { HabitLog } from '../../core/models/habit-log';
import { Notifier } from '../../core/notifier';
import { lowerFirst as lower } from '../../core/text';
import { Confirmer } from '../../shared/confirmer';
import { EmptyState } from '../../shared/empty-state';
import { HabitAvatar } from '../../shared/habit-avatar';
import { LoadingIndicator } from '../../shared/loading-indicator';
import { ShareLauncher } from '../share/share-launcher';
import { Heatmap } from '../../shared/heatmap';
import { LAWS } from './habit-options';

@Component({
  selector: 'app-habit-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    EmptyState,
    HabitAvatar,
    LoadingIndicator,
    Heatmap,
  ],
  templateUrl: './habit-detail.html',
})
export class HabitDetail {
  private readonly habitsApi = inject(HabitsApi);
  private readonly notify = inject(Notifier);
  private readonly confirm = inject(Confirmer);
  private readonly router = inject(Router);
  private readonly shareLauncher = inject(ShareLauncher);

  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly today = today();
  /** Weeks of history that fit the calendar's width; reported by the heatmap. */
  protected readonly weeks = signal(0);
  /** First day shown: the Sunday starting the earliest visible week. */
  private readonly from = computed(() => {
    const startOfWeek = addDays(this.today, -parseIsoDate(this.today).getDay());
    return addDays(startOfWeek, -(Math.max(this.weeks(), 1) - 1) * 7);
  });

  protected readonly habit = httpResource<Habit>(() => this.habitsApi.urls.habit(this.id()));
  protected readonly logs = httpResource<HabitLog[]>(
    () => (this.weeks() ? this.habitsApi.urls.logs(this.id(), this.from(), this.today) : undefined),
    { defaultValue: [] },
  );
  protected readonly busy = signal(false);

  protected readonly h = computed(() => (this.habit.hasValue() ? this.habit.value() : undefined));
  protected readonly laws = computed(() => LAWS[this.h()?.kind ?? 'build']);

  protected readonly days = computed<DayCount[]>(() => {
    const logged = new Set(this.logs.value().map((l) => l.date));
    const out: DayCount[] = [];
    if (!this.weeks()) return out;
    for (let date = this.from(); date <= this.today; date = addDays(date, 1)) {
      out.push({ date, count: logged.has(date) ? 1 : 0 });
    }
    return out;
  });

  protected readonly notes = computed(() =>
    this.logs
      .value()
      .filter((l) => l.note)
      .slice(0, 5),
  );

  protected readonly isOutOfRange = computed(() => {
    const start = this.h()?.startDate ?? this.today;
    return (date: string) => date < start || date > this.today;
  });

  protected readonly intention = computed(() => {
    const h = this.h();
    if (!h) return '';
    const parts = [
      h.kind === 'break' ? `I will avoid ${lower(h.name)}` : `I will ${lower(h.name)}`,
    ];
    if (h.cueTime) parts.push(`at ${formatTime(h.cueTime)}`);
    if (h.cueLocation) parts.push(`in ${h.cueLocation}`);
    return `${parts.join(' ')}.`;
  });

  protected readonly scheduleLabel = computed(() => describeSchedule(this.h()?.scheduleDays ?? 0));
  protected readonly ratePercent = computed(() =>
    Math.round((this.h()?.stats.completionRate ?? 0) * 100),
  );
  protected readonly scheduledToday = computed(() => {
    const h = this.h();
    return !!h && isScheduled(h.scheduleDays, this.today);
  });

  protected lower = lower;

  protected async toggleDay(date: string): Promise<void> {
    if (this.busy()) return;
    const isLogged = this.logs.value().some((l) => l.date === date);
    this.busy.set(true);
    try {
      await firstValueFrom(
        isLogged ? this.habitsApi.uncheck(this.id(), date) : this.habitsApi.check(this.id(), date),
      );
      this.logs.reload();
      this.habit.reload();
    } catch (err) {
      this.notify.error(err);
    } finally {
      this.busy.set(false);
    }
  }

  protected share(): void {
    const h = this.h();
    if (h) void this.shareLauncher.shareHabit(h);
  }

  protected async archive(): Promise<void> {
    try {
      await firstValueFrom(this.habitsApi.archive(this.id()));
      this.notify.info('Habit archived');
      this.habit.reload();
    } catch (err) {
      this.notify.error(err);
    }
  }

  protected async restore(): Promise<void> {
    try {
      await firstValueFrom(this.habitsApi.restore(this.id()));
      this.notify.info('Habit restored');
      this.habit.reload();
    } catch (err) {
      this.notify.error(err);
    }
  }

  protected async remove(): Promise<void> {
    const h = this.h();
    if (!h) return;
    const ok = await this.confirm.ask({
      title: `Delete “${h.name}”?`,
      message: 'This permanently deletes the habit and its entire history.',
      confirm: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.habitsApi.delete(h.id));
      this.notify.info('Habit deleted');
      await this.router.navigateByUrl('/habits');
    } catch (err) {
      this.notify.error(err);
    }
  }
}
