import { Component, computed, input, model, output } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule, SubscriptSizing } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';

const pad = (n: number) => String(n).padStart(2, '0');

/** Parses a 24h `HH:MM` string into a Date (the date part is irrelevant). */
function toDate(value: string): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match ? new Date(2000, 0, 1, Number(match[1]), Number(match[2])) : null;
}

/**
 * A Material timepicker that lets the user pick a time from a list (or type
 * one) and stores it as a 24h `HH:MM` string, the format the API uses.
 * Implements `FormValueControl` so it binds to signal forms with `[formField]`.
 */
@Component({
  selector: 'app-time-field',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <mat-form-field class="w-full" [subscriptSizing]="subscriptSizing()">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [matTimepicker]="picker"
        [value]="date()"
        (valueChange)="onPicked($event)"
        [disabled]="disabled()"
        (blur)="touch.emit()"
      />
      <span matIconSuffix class="flex flex-nowrap items-center">
        @if (value()) {
          <button
            mat-icon-button
            type="button"
            [attr.aria-label]="'Clear ' + label()"
            [disabled]="disabled()"
            (click)="value.set('')"
          >
            <mat-icon>close</mat-icon>
          </button>
        }
        <mat-timepicker-toggle [for]="picker" />
      </span>
      <mat-timepicker #picker [interval]="interval()" />
      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  host: { class: 'block' },
})
export class TimeField implements FormValueControl<string> {
  /** 24h `HH:MM`, or an empty string when no time is set. */
  readonly value = model('');
  readonly disabled = input(false);
  readonly touch = output<void>();

  readonly label = input('Time');
  readonly hint = input('');
  /** Spacing between the options in the dropdown, e.g. `15m` or `1h`. */
  readonly interval = input('15m');
  readonly subscriptSizing = input<SubscriptSizing>('fixed');

  protected readonly date = computed(() => toDate(this.value()));

  protected onPicked(date: Date | null): void {
    this.value.set(date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '');
  }
}
