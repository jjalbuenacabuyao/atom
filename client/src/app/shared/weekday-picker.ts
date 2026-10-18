import { Component, input, model, output } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { WEEKDAYS } from '../core/dates';

/**
 * Selects the weekdays a habit is scheduled on, stored as a bitmask
 * (bit 0 = Sunday). Implements `FormValueControl` so it binds directly to a
 * signal form field with `[formField]`.
 */
@Component({
  selector: 'app-weekday-picker',
  template: `
    @for (day of days; track day.bit) {
      <button
        type="button"
        class="size-11 cursor-pointer rounded-full border border-outline bg-transparent type-label-large text-on-surface transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-38 [&.on]:border-transparent [&.on]:bg-primary [&.on]:text-on-primary"
        [class.on]="isOn(day.bit)"
        [attr.aria-pressed]="isOn(day.bit)"
        [attr.aria-label]="day.label"
        [disabled]="disabled()"
        (click)="toggleDay(day.bit)"
        (blur)="touch.emit()"
      >
        {{ day.short }}
      </button>
    }
  `,
  host: { role: 'group', 'aria-label': 'Scheduled days', class: 'flex flex-wrap gap-2' },
})
export class WeekdayPicker implements FormValueControl<number> {
  readonly value = model(0);
  readonly disabled = input(false);
  readonly touch = output<void>();

  protected readonly days = WEEKDAYS;

  protected isOn(bit: number): boolean {
    return (this.value() & bit) !== 0;
  }

  protected toggleDay(bit: number): void {
    const next = this.value() ^ bit;
    // A habit must be scheduled on at least one day.
    if (next !== 0) this.value.set(next);
  }
}
