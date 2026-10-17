import { BreakpointObserver } from '@angular/cdk/layout';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { describeSchedule, EVERY_DAY, formatTime, today } from '../../core/dates';
import { HabitsService } from '../../core/habits.service';
import { IdentitiesService } from '../../core/identities.service';
import type { Habit, HabitInput, HabitKind, Identity } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { lowerFirst as lower } from '../../core/text';
import { toServerErrors } from '../../shared/form-errors';
import { HabitAvatar } from '../../shared/habit-avatar';
import { LoadingIndicator } from '../../shared/loading-indicator';
import { TimeField } from '../../shared/time-field';
import { WeekdayPicker } from '../../shared/weekday-picker';
import { HABIT_COLORS, HABIT_ICONS, LAWS } from './habit-options';

interface HabitFormModel {
  name: string;
  kind: HabitKind;
  /** Empty string means "no identity". */
  identityId: string;
  /** Optional new identity to create and link on save. */
  newIdentity: string;
  cueTime: string;
  cueLocation: string;
  stackAfter: string;
  obviousNote: string;
  attractiveNote: string;
  easyNote: string;
  satisfyingNote: string;
  scheduleDays: number;
  color: string;
  icon: string;
  startDate: string;
}

function emptyModel(): HabitFormModel {
  return {
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
    scheduleDays: EVERY_DAY,
    color: HABIT_COLORS[0],
    icon: HABIT_ICONS[0],
    startDate: today(),
  };
}

function fromHabit(h: Habit): HabitFormModel {
  return {
    ...emptyModel(),
    name: h.name,
    kind: h.kind,
    identityId: h.identity?.id ?? '',
    cueTime: h.cueTime,
    cueLocation: h.cueLocation,
    stackAfter: h.stackAfter,
    obviousNote: h.obviousNote,
    attractiveNote: h.attractiveNote,
    easyNote: h.easyNote,
    satisfyingNote: h.satisfyingNote,
    scheduleDays: h.scheduleDays,
    color: h.color,
    icon: h.icon,
    startDate: h.startDate,
  };
}

@Component({
  selector: 'app-habit-editor',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatStepperModule,
    HabitAvatar,
    LoadingIndicator,
    TimeField,
    WeekdayPicker,
  ],
  templateUrl: './habit-editor.html',
  styleUrl: './habit-editor.scss',
})
export class HabitEditor {
  private readonly habitsApi = inject(HabitsService);
  private readonly identitiesApi = inject(IdentitiesService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotifyService);

  /** Route parameter; present when editing an existing habit. */
  readonly id = input<string>();
  /** Optional `?title=&kind=` query parameters to prefill a new habit. */
  readonly title = input<string>();
  readonly kind = input<HabitKind>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly colors = HABIT_COLORS;
  protected readonly icons = HABIT_ICONS;

  protected readonly vertical = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 719.98px)')
      .pipe(map((s) => s.matches)),
    { initialValue: false },
  );

  protected readonly existing = httpResource<Habit>(() => {
    const id = this.id();
    return id ? this.habitsApi.urls.habit(id) : undefined;
  });
  protected readonly identities = httpResource<Identity[]>(() => this.identitiesApi.url, {
    defaultValue: [],
  });

  /** Form state, reset from the server copy whenever an existing habit loads. */
  protected readonly model = linkedSignal<HabitFormModel>(() =>
    this.existing.hasValue()
      ? fromHabit(this.existing.value())
      : {
          ...emptyModel(),
          name: this.title() ?? '',
          kind: this.kind() === 'break' ? 'break' : 'build',
        },
  );

  protected readonly habitForm = form(this.model, (p) => {
    required(p.name, { message: 'Give your habit a name' });
    maxLength(p.name, 120, { message: 'Keep it under 120 characters' });
    maxLength(p.newIdentity, 160, { message: 'Keep it under 160 characters' });
    maxLength(p.cueLocation, 200);
    maxLength(p.stackAfter, 200);
    maxLength(p.obviousNote, 1000);
    maxLength(p.attractiveNote, 1000);
    maxLength(p.easyNote, 1000);
    maxLength(p.satisfyingNote, 1000);
    required(p.startDate, { message: 'Pick a start date' });
    validate(p.scheduleDays, ({ value }) =>
      value() > 0 ? undefined : { kind: 'schedule', message: 'Pick at least one day' },
    );
  });

  protected readonly laws = computed(() => LAWS[this.model().kind]);
  protected readonly isBreak = computed(() => this.model().kind === 'break');
  protected readonly schedule = computed(() => describeSchedule(this.model().scheduleDays));

  /** Live preview of the implementation intention and habit stack. */
  protected readonly intention = computed(() => {
    const m = this.model();
    const name = m.name.trim() || '[behaviour]';
    if (m.kind === 'break') {
      return `I will avoid ${lower(name)}${m.cueLocation ? ` in ${m.cueLocation}` : ''}.`;
    }
    const time = m.cueTime ? formatTime(m.cueTime) : '[time]';
    const place = m.cueLocation.trim() || '[location]';
    return `I will ${lower(name)} at ${time} in ${place}.`;
  });
  protected readonly stack = computed(() => {
    const m = this.model();
    if (!m.stackAfter.trim()) return '';
    return `After ${lower(m.stackAfter.trim())}, I will ${lower(m.name.trim() || '[new habit]')}.`;
  });

  protected onSubmit(event?: Event): void {
    event?.preventDefault();
    void submit(this.habitForm, async () => {
      const m = this.model();
      let saved: Habit;
      try {
        let identityId: string | null = m.identityId || null;
        if (m.newIdentity.trim()) {
          const created = await firstValueFrom(
            this.identitiesApi.create({ statement: m.newIdentity.trim(), description: '' }),
          );
          identityId = created.id;
          this.model.update((v) => ({ ...v, identityId: created.id, newIdentity: '' }));
          this.identities.reload();
        }
        const input: HabitInput = {
          name: m.name.trim(),
          kind: m.kind,
          identityId,
          cueTime: m.cueTime,
          cueLocation: m.cueLocation,
          stackAfter: m.kind === 'build' ? m.stackAfter : '',
          obviousNote: m.obviousNote,
          attractiveNote: m.attractiveNote,
          easyNote: m.easyNote,
          satisfyingNote: m.satisfyingNote,
          scheduleDays: m.scheduleDays,
          color: m.color,
          icon: m.icon,
          startDate: m.startDate,
        };
        const id = this.id();
        saved = await firstValueFrom(
          id ? this.habitsApi.update(id, input) : this.habitsApi.create(input),
        );
      } catch (err) {
        return toServerErrors(this.habitForm, err);
      }
      this.notify.info(this.isEdit() ? 'Habit updated' : 'Habit created. Cast your first vote!');
      await this.router.navigate(['/habits', saved.id]);
      return undefined;
    });
  }
}
