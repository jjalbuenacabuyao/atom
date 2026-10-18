import { Component, computed, input } from '@angular/core';

const WAVE_POINTS = 240;
const STROKE = 8;
const WAVELENGTH = 28;
const AMPLITUDE = 2;
/** Gap between the active wave and the track, in px along the circle. */
const GAP = STROKE + 6;

/**
 * Material 3 Expressive wavy circular progress indicator with projected
 * centre content. The active arc is a sine wave; the remaining track is flat
 * and separated from it by a gap. The arc always has the same number of
 * points, so changes animate smoothly with a CSS `d` transition.
 */
@Component({
  selector: 'app-progress-ring',
  template: `
    <svg
      class="absolute inset-0 overflow-visible fill-none stroke-8 [stroke-linecap:round] [stroke-linejoin:round]"
      [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
      aria-hidden="true"
    >
      @if (trackPath()) {
        <!-- The track stays visible on any tonal container the ring sits on. -->
        <path class="stroke-current/20" [attr.d]="trackPath()" />
      }
      @if (clamped() > 0) {
        <path
          class="stroke-primary transition-[d] duration-(--atom-spring-slow-duration) ease-spring"
          [attr.d]="wavePath()"
          [style.d]="'path(&quot;' + wavePath() + '&quot;)'"
        />
      }
    </svg>
    <div class="relative text-center"><ng-content /></div>
  `,
  host: {
    class: 'relative inline-grid place-items-center',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'percent()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuetext]': 'valueText() || null',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class ProgressRing {
  /** Progress between 0 and 1. */
  readonly value = input.required<number>();
  readonly size = input(140);
  /** Accessible name, e.g. "Habits completed today". */
  readonly label = input('Progress');
  /** Optional human-readable value, e.g. "3 of 5". */
  readonly valueText = input('');

  protected readonly clamped = computed(() => Math.min(1, Math.max(0, this.value())));
  protected readonly percent = computed(() => Math.round(this.clamped() * 100));

  private readonly radius = computed(() => this.size() / 2 - STROKE / 2 - AMPLITUDE - 2);

  /** Angle (radians) of the gap on each side of the active arc. */
  private readonly gapAngle = computed(() => GAP / this.radius());

  protected readonly wavePath = computed(() => {
    const r = this.radius();
    const c = this.size() / 2;
    const full = this.clamped() >= 1;
    // Leave room for the gaps unless the circle is complete.
    const sweep = full
      ? Math.PI * 2
      : Math.max(0.0001, this.clamped() * (Math.PI * 2 - 2 * this.gapAngle()));
    const waves = Math.max(6, Math.round((2 * Math.PI * r) / WAVELENGTH));
    const parts: string[] = [];
    for (let i = 0; i <= WAVE_POINTS; i++) {
      const t = (i / WAVE_POINTS) * sweep;
      const rr = r + AMPLITUDE * Math.sin(waves * t);
      const a = t - Math.PI / 2;
      parts.push(
        `${i === 0 ? 'M' : 'L'}${(c + rr * Math.cos(a)).toFixed(2)} ${(c + rr * Math.sin(a)).toFixed(2)}`,
      );
    }
    return parts.join(' ');
  });

  protected readonly trackPath = computed(() => {
    const p = this.clamped();
    if (p >= 1) return '';
    const r = this.radius();
    const c = this.size() / 2;
    const gap = this.gapAngle();
    const start = p > 0 ? p * (Math.PI * 2 - 2 * gap) + gap : 0;
    const end = p > 0 ? Math.PI * 2 - gap : Math.PI * 2 - 0.0001;
    if (end <= start) return '';
    const point = (t: number) => {
      const a = t - Math.PI / 2;
      return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
    };
    const large = end - start > Math.PI ? 1 : 0;
    return `M${point(start)} A${r} ${r} 0 ${large} 1 ${point(end)}`;
  });
}
