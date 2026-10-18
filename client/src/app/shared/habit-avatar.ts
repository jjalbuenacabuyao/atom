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
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      class="absolute inset-0 size-full overflow-visible transition-transform duration-(--atom-spring-default-duration) ease-spring group-hover/avatar:scale-104 group-hover/avatar:rotate-30 in-[.habit-item:hover]:scale-104 in-[.habit-item:hover]:rotate-30 in-[app-habit-row:hover]:scale-104 in-[app-habit-row:hover]:rotate-30"
    >
      <path
        class="fill-[color-mix(in_srgb,var(--habit-color)_22%,var(--mat-sys-surface-container-lowest))] transition-[d] duration-(--atom-spring-default-duration) ease-spring"
        [attr.d]="path()"
        [style.d]="css()"
      />
    </svg>
    <mat-icon aria-hidden="true" class="relative size-(--icon-size)! text-(length:--icon-size)!">{{
      icon()
    }}</mat-icon>
  `,
  host: {
    // Hovering the avatar or its row spins the shape a little (expressive motion).
    class:
      'group/avatar relative inline-grid flex-none place-items-center text-[color-mix(in_srgb,var(--habit-color)_80%,var(--mat-sys-on-surface))]',
    '[style.--habit-color]': 'color()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.--icon-size.px]': 'size() * 0.5',
  },
})
export class HabitAvatar {
  readonly icon = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input(44);
  readonly shape = input<ShapeName>('cookie9');

  protected readonly path = computed(() => shapePath(this.shape()));
  protected readonly css = computed(() => shapeCss(this.shape()));
}
