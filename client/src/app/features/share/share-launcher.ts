import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { addDays, today } from '../../core/dates';
import { HabitsApi } from '../../core/habits-api';
import type { Dashboard } from '../../core/models/dashboard';
import type { Habit } from '../../core/models/habit';
import type { HabitShareCard, OverviewShareCard } from './share-card';

/** Opens the share dialog for a habit or for overall progress. */
@Service()
export class ShareLauncher {
  private readonly dialog = inject(MatDialog);
  private readonly habitsApi = inject(HabitsApi);

  shareHabit(habit: Habit): Promise<void> {
    return this.open(`Share “${habit.name}”`, async (): Promise<HabitShareCard> => {
      const date = today();
      // A year of history covers the widest layout (the renderer picks the weeks).
      const logs = await firstValueFrom(this.habitsApi.logs(habit.id, addDays(date, -370), date));
      return {
        kind: 'habit',
        date,
        name: habit.name,
        habitKind: habit.kind,
        icon: habit.icon,
        color: habit.color,
        identity: habit.identity?.statement ?? null,
        startDate: habit.startDate,
        stats: habit.stats,
        doneDates: new Set(logs.map((l) => l.date)),
      };
    });
  }

  shareProgress(dashboard: Dashboard, userName: string): Promise<void> {
    return this.open('Share your progress', async (): Promise<OverviewShareCard> => {
      // Fetch a full year of activity so the grid fills the wider layouts.
      const full = await firstValueFrom(this.habitsApi.getDashboard(dashboard.date, 7 * 53));
      return {
        kind: 'overview',
        date: full.date,
        userName,
        completed: full.completedCount,
        scheduled: full.scheduledCount,
        totalVotes: full.totalVotes,
        bestStreak: full.bestStreak,
        habitCount: full.habits.length,
        identities: full.identities.map((i) => ({ statement: i.statement, votes: i.votes })),
        activity: full.activity,
      };
    });
  }

  private async open(title: string, card: () => Promise<HabitShareCard | OverviewShareCard>) {
    // Lazy-load the dialog and canvas renderer only when someone shares.
    const { ShareDialog } = await import('./share-dialog');
    this.dialog.open(ShareDialog, {
      data: { title, card },
      width: '560px',
      maxWidth: '95vw',
      autoFocus: 'dialog',
    });
  }
}
