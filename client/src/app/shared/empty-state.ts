import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { shapePath } from './shapes';

/**
 * Empty, error and onboarding states: an icon on an M3 Expressive "sunny"
 * shape (which turns on hover), a title, and projected text and actions.
 */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="relative mb-2 grid size-26 place-items-center">
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        class="absolute inset-0 size-full fill-primary-container transition-transform duration-(--atom-spring-slow-duration) ease-spring group-hover:rotate-45"
      >
        <path [attr.d]="shape" />
      </svg>
      <mat-icon aria-hidden="true" class="relative icon-12! text-on-primary-container">{{
        icon()
      }}</mat-icon>
    </div>
    <h2 class="type-title-large text-on-surface">{{ heading() }}</h2>
    <ng-content />
  `,
  host: {
    class:
      'group grid justify-items-center gap-3 rounded-xl bg-surface-container-low px-4 py-12 text-center text-on-surface-variant [&_p]:max-w-[44ch]',
  },
})
export class EmptyState {
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();

  protected readonly shape = shapePath('sunny');
}
