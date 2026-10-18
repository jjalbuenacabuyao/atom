import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatRipple } from '@angular/material/core';
import { parseIsoDate, today } from '../core/dates';
import type { DayCount } from '../core/models/dashboard';

interface Cell {
  date: string;
  count: number;
  level: number;
  label: string;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'short' });

/** Minimum cell size and gap in fill mode (24px meets WCAG 2.5.8 target size). */
const FILL_MIN_CELL = 24;
const FILL_GAP = 4;
const SCROLLER_PADDING = 4;
/** Width of the weekday label column plus its gap (interactive mode only). */
const WEEKDAY_COLUMN = 16 + 8;
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * A GitHub-style calendar heatmap. Columns are weeks, rows are weekdays.
 * When `interactive` is set, each day is a button that emits `dayToggled`.
 * In `fill` mode the cells stretch to span the full width, and
 * `capacityChange` reports how many weeks fit so the parent can supply them.
 */
@Component({
  selector: 'app-heatmap',
  template: `
    <div
      class="scroller"
      #scroller
      [attr.tabindex]="interactive() ? null : 0"
      [attr.role]="interactive() ? null : 'region'"
      [attr.aria-label]="interactive() ? null : 'Activity calendar'"
    >
      <div class="layout">
        <div class="months" aria-hidden="true">
          @for (m of months(); track $index) {
            <span [style.grid-column]="m.column">{{ m.label }}</span>
          }
        </div>
        @if (interactive()) {
          <div class="weekdays" aria-hidden="true">
            @for (letter of weekdays; track $index) {
              <span>{{ letter }}</span>
            }
          </div>
        }
        <div
          class="grid"
          [attr.role]="interactive() ? 'group' : 'img'"
          [attr.aria-label]="ariaLabel()"
        >
          @for (pad of leadingBlanks(); track $index) {
            <span class="cell blank"></span>
          }
          @for (cell of cells(); track cell.date) {
            @if (interactive()) {
              <button
                type="button"
                class="cell day"
                matRipple
                [matRippleCentered]="true"
                [matRippleDisabled]="isDisabled()(cell.date)"
                [class.done]="cell.count > 0"
                [class.today]="cell.date === todayDate"
                [attr.aria-label]="cell.label"
                [attr.aria-pressed]="cell.count > 0"
                [attr.aria-current]="cell.date === todayDate ? 'date' : null"
                [title]="cell.label"
                [disabled]="isDisabled()(cell.date)"
                (click)="dayToggled.emit(cell.date)"
              ></button>
            } @else {
              <span [class]="'cell l' + cell.level" [title]="cell.label"></span>
            }
          }
        </div>
      </div>
    </div>
    <div class="legend" aria-hidden="true">
      @if (interactive()) {
        <span class="key"></span> Not done <span class="key done"></span> Done
        <span class="key today"></span> Today
      } @else {
        Less
        @for (l of [0, 1, 2, 3, 4]; track l) {
          <span [class]="'cell l' + l"></span>
        }
        More
      }
    </div>
  `,
  imports: [MatRipple],
  styleUrl: './heatmap.scss',
  host: {
    '[class.interactive]': 'interactive()',
    '[class.fill]': 'fill()',
    '[style.--cols]': 'columns()',
  },
})
export class Heatmap {
  /** Consecutive days, oldest first. */
  readonly days = input.required<DayCount[]>();
  readonly unit = input('check-in');
  readonly interactive = input(false);
  readonly isDisabled = input<(date: string) => boolean>(() => false);
  readonly fill = input(false);
  readonly dayToggled = output<string>();
  /** Number of week columns that fit the available width (fill mode only). */
  readonly capacityChange = output<number>();

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private capacity = 0;

  protected readonly todayDate = today();
  protected readonly weekdays = WEEKDAY_LETTERS;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => {
        if (!this.fill()) return;
        const width =
          entry.contentRect.width - SCROLLER_PADDING - (this.interactive() ? WEEKDAY_COLUMN : 0);
        const weeks = Math.max(4, Math.floor((width + FILL_GAP) / (FILL_MIN_CELL + FILL_GAP)));
        if (weeks !== this.capacity) {
          this.capacity = weeks;
          this.capacityChange.emit(weeks);
        }
      });
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    // Keep the most recent weeks in view when the grid is wider than its container.
    afterRenderEffect({
      write: () => {
        this.days();
        const el = this.scroller().nativeElement;
        el.scrollLeft = el.scrollWidth;
      },
    });
  }

  protected readonly leadingBlanks = computed(() => {
    const first = this.days()[0];
    return first ? Array.from({ length: parseIsoDate(first.date).getDay() }) : [];
  });

  protected readonly columns = computed(() =>
    Math.ceil((this.leadingBlanks().length + this.days().length) / 7),
  );

  protected readonly cells = computed<Cell[]>(() => {
    const days = this.days();
    const max = Math.max(1, ...days.map((d) => d.count));
    return days.map((d) => ({
      date: d.date,
      count: d.count,
      level: d.count === 0 ? 0 : Math.max(1, Math.ceil((d.count / max) * 4)),
      label: `${dateFormat.format(parseIsoDate(d.date))}: ${d.count} ${this.unit()}${d.count === 1 ? '' : 's'}`,
    }));
  });

  protected readonly months = computed(() => {
    const out: { label: string; column: number }[] = [];
    const offset = this.leadingBlanks().length;
    let last = -1;
    this.days().forEach((d, i) => {
      const date = parseIsoDate(d.date);
      const column = Math.floor((i + offset) / 7) + 1;
      if (date.getMonth() !== last && date.getDate() <= 7) {
        out.push({ label: monthFormat.format(date), column });
        last = date.getMonth();
      }
    });
    return out;
  });

  protected readonly ariaLabel = computed(() => {
    const days = this.days();
    const active = days.filter((d) => d.count > 0).length;
    return `Activity over the last ${days.length} days: ${active} active days`;
  });
}
