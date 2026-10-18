import { Component, input } from '@angular/core';

/** The Atom mark: a nucleus with three orbits. */
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 64 64" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
      <g class="fill-none stroke-primary" stroke-width="3.5">
        <ellipse cx="32" cy="32" rx="27" ry="10.5" />
        <ellipse cx="32" cy="32" rx="27" ry="10.5" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="27" ry="10.5" transform="rotate(120 32 32)" />
      </g>
      <circle cx="32" cy="32" r="6" class="fill-tertiary" />
    </svg>
    @if (showName()) {
      <span class="type-title-large font-brand tracking-[-0.01em]">Atom</span>
    }
  `,
  host: { class: 'inline-flex items-center gap-2.5' },
})
export class Logo {
  readonly size = input(32);
  readonly showName = input(true);
}
