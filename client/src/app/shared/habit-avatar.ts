import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ShapeName, shapeCss, shapePath } from './shapes';

/**
 * The habit's icon inside an M3 Expressive shape, tinted with the habit colour.
 * The shape gently rotates and morphs when its row or card is hovered.
 */
@Component({
  selector: 'app-habit-avatar',
  imports: [MatIconModule],
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path [attr.d]="path()" [style.d]="css()" />
    </svg>
    <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
  `,
  host: {
    '[style.--habit-color]': 'color()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.--icon-size.px]': 'size() * 0.5',
  },
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      place-items: center;
      flex: none;
      color: color-mix(in srgb, var(--habit-color) 80%, var(--mat-sys-on-surface));
    }
    svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      transition: transform var(--atom-spring-default-duration) var(--atom-spring-default);
    }
    path {
      fill: color-mix(in srgb, var(--habit-color) 22%, var(--mat-sys-surface-container-lowest));
      transition: d var(--atom-spring-default-duration) var(--atom-spring-default);
    }
    mat-icon {
      position: relative;
      width: var(--icon-size);
      height: var(--icon-size);
      font-size: var(--icon-size);
    }
    /* Hovering the avatar or its row spins the shape a little (expressive motion). */
    :host(:hover) svg,
    :host-context(app-habit-row:hover) svg,
    :host-context(.habit-item:hover) svg {
      transform: rotate(30deg) scale(1.04);
    }
  `,
})
export class HabitAvatar {
  readonly icon = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input(44);
  readonly shape = input<ShapeName>('cookie9');

  protected readonly path = computed(() => shapePath(this.shape()));
  protected readonly css = computed(() => shapeCss(this.shape()));
}
