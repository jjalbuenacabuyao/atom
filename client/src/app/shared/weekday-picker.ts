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
  host: { role: 'group', 'aria-label': 'Scheduled days' },
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid var(--mat-sys-outline);
      background: transparent;
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-label-large);
      cursor: pointer;
      transition:
        background-color 150ms ease,
        color 150ms ease;
    }
    button.on {
      border-color: transparent;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    button:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    button:disabled {
      opacity: 0.38;
      cursor: default;
    }
  `,
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
