import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { formatTime } from '../../core/dates';
import { ScorecardService } from '../../core/scorecard.service';
import type { Rating, ScorecardEntry } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { toServerErrors } from '../../shared/form-errors';
import { LoadingIndicator } from '../../shared/loading-indicator';
import { TimeField } from '../../shared/time-field';

export const RATINGS: { value: Rating; symbol: string; label: string }[] = [
  { value: 'positive', symbol: '+', label: 'Good habit' },
  { value: 'neutral', symbol: '=', label: 'Neutral habit' },
  { value: 'negative', symbol: '−', label: 'Bad habit' },
];

@Component({
  selector: 'app-scorecard',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    TimeField,
    LoadingIndicator,
  ],
  templateUrl: './scorecard.html',
  styleUrl: './scorecard.scss',
})
export class Scorecard {
  private readonly api = inject(ScorecardService);
  private readonly notify = inject(NotifyService);

  protected readonly ratings = RATINGS;
  protected readonly entries = httpResource<ScorecardEntry[]>(() => this.api.url, {
    defaultValue: [],
  });

  protected readonly counts = computed(() => {
    const out: Record<Rating, number> = { positive: 0, neutral: 0, negative: 0 };
    for (const e of this.entries.value()) out[e.rating]++;
    return out;
  });

  protected readonly model = signal({
    timeOfDay: '',
    description: '',
    rating: 'neutral' as Rating,
  });
  protected readonly entryForm = form(this.model, (p) => {
    required(p.description, { message: 'Describe what you do' });
    maxLength(p.description, 200, { message: 'Keep it under 200 characters' });
  });

  protected time(entry: ScorecardEntry): string {
    return formatTime(entry.timeOfDay);
  }

  protected symbol(rating: Rating): string {
    return RATINGS.find((r) => r.value === rating)?.symbol ?? '=';
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.entryForm, async () => {
      try {
        await firstValueFrom(this.api.create(this.model()));
      } catch (err) {
        return toServerErrors(this.entryForm, err);
      }
      // Keep the time and rating to speed up entering a sequence of habits.
      this.model.update((m) => ({ ...m, description: '' }));
      this.entryForm().reset();
      this.entries.reload();
      return undefined;
    });
  }

  protected async rate(entry: ScorecardEntry, rating: Rating): Promise<void> {
    if (entry.rating === rating) return;
    this.entries.value.update((list) =>
      list.map((e) => (e.id === entry.id ? { ...e, rating } : e)),
    );
    try {
      await firstValueFrom(
        this.api.update(entry.id, {
          description: entry.description,
          rating,
          timeOfDay: entry.timeOfDay,
        }),
      );
    } catch (err) {
      this.notify.error(err);
      this.entries.reload();
    }
  }

  protected async remove(entry: ScorecardEntry): Promise<void> {
    try {
      await firstValueFrom(this.api.delete(entry.id));
      this.entries.value.update((list) => list.filter((e) => e.id !== entry.id));
    } catch (err) {
      this.notify.error(err);
    }
  }
}
