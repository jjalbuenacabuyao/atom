import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ShapeName, shapeCss, shapePath } from './shapes';

/** The sequence of shapes the indicator morphs through. */
const SEQUENCE: ShapeName[] = ['burst', 'cookie9', 'clover', 'sunny', 'cookie4', 'circle'];

/**
 * Material 3 Expressive loading indicator: a shape that continuously morphs
 * through the expressive shape library while rotating, inside a tonal
 * container. Used for indeterminate waits of a few seconds or less.
 */
@Component({
  selector: 'app-loading-indicator',
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true" class="size-[62%] overflow-visible">
      <g #spinner class="origin-[50px_50px]">
        <path #shape class="fill-on-primary-container" [attr.d]="initial" />
      </g>
    </svg>
  `,
  host: {
    class: 'inline-grid place-items-center rounded-full bg-primary-container',
    role: 'progressbar',
    '[attr.aria-label]': 'label()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class LoadingIndicator {
  readonly size = input(48);
  readonly label = input('Loading');

  protected readonly initial = shapePath(SEQUENCE[0]);
  private readonly shape = viewChild.required<ElementRef<SVGPathElement>>('shape');
  private readonly spinner = viewChild.required<ElementRef<SVGGElement>>('spinner');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof this.spinner().nativeElement.animate !== 'function') return;
      const reduceMotion =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animations: Animation[] = [];
      animations.push(
        this.spinner().nativeElement.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
          { duration: reduceMotion ? 4000 : 1600, iterations: Infinity },
        ),
      );
      if (!reduceMotion) {
        // Morph via the CSS `d` property where supported (Chromium, Firefox).
        const frames = [...SEQUENCE, SEQUENCE[0]].map((s) => ({ d: shapeCss(s) }));
        try {
          animations.push(
            this.shape().nativeElement.animate(frames, {
              duration: 650 * SEQUENCE.length,
              iterations: Infinity,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }),
          );
        } catch {
          // Browsers without `d` animation still show the rotating shape.
        }
      }
      destroyRef.onDestroy(() => animations.forEach((a) => a.cancel()));
    });
  }
}
