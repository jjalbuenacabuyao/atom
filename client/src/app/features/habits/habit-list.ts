import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describeSchedule } from '../../core/dates';
import { HabitsService } from '../../core/habits.service';
import type { Habit } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { ConfirmService } from '../../shared/confirm-dialog';
import { HabitAvatar } from '../../shared/habit-avatar';
import { LoadingIndicator } from '../../shared/loading-indicator';

type View = 'active' | 'archived';

@Component({
  selector: 'app-habit-list',
  imports: [
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    HabitAvatar,
    LoadingIndicator,
  ],
  templateUrl: './habit-list.html',
  styleUrl: './habit-list.scss',
})
export class HabitList {
  private readonly habitsApi = inject(HabitsService);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  protected readonly view = signal<View>('active');
  protected readonly resource = httpResource<Habit[]>(
    () => this.habitsApi.urls.habits(this.view() === 'archived'),
    { defaultValue: [] },
  );

  /** Local, reorderable copy of the server list. */
  protected readonly habits = linkedSignal(() =>
    this.resource
      .value()
      .filter((h) => (this.view() === 'archived' ? h.archivedAt !== null : h.archivedAt === null)),
  );
  protected readonly loading = computed(() => this.resource.isLoading());

  protected schedule(habit: Habit): string {
    return describeSchedule(habit.scheduleDays);
  }

  protected percent(rate: number): string {
    return `${Math.round(rate * 100)}%`;
  }

  protected async drop(event: CdkDragDrop<Habit[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) return;
    const next = [...this.habits()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.habits.set(next);
    try {
      await firstValueFrom(this.habitsApi.reorder(next.map((h) => h.id)));
    } catch (err) {
      this.notify.error(err, 'Could not save the new order');
      this.resource.reload();
    }
  }

  protected async archive(habit: Habit): Promise<void> {
    await this.run(this.habitsApi.archive(habit.id), `Archived “${habit.name}”`, () =>
      this.restore(habit),
    );
  }

  protected async restore(habit: Habit): Promise<void> {
    await this.run(this.habitsApi.restore(habit.id), `Restored “${habit.name}”`);
  }

  protected async remove(habit: Habit): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete “${habit.name}”?`,
      message: `This permanently deletes the habit and all ${habit.stats.totalVotes} check-ins. Archive it instead to keep your history.`,
      confirm: 'Delete',
      destructive: true,
    });
    if (ok) await this.run(this.habitsApi.delete(habit.id), 'Habit deleted');
  }

  private async run(
    request: ReturnType<HabitsService['archive']>,
    message: string,
    undo?: () => void,
  ): Promise<void> {
    try {
      await firstValueFrom(request);
      this.notify.info(message, undo ? 'Undo' : undefined, undo);
      this.resource.reload();
    } catch (err) {
      this.notify.error(err);
    }
  }
}
