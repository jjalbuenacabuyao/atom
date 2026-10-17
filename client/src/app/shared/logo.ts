import { Component, input } from '@angular/core';

/** The Atom mark: a nucleus with three orbits. */
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 64 64" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
      <g fill="none" class="orbit" stroke-width="3.5">
        <ellipse cx="32" cy="32" rx="27" ry="10.5" />
        <ellipse cx="32" cy="32" rx="27" ry="10.5" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="27" ry="10.5" transform="rotate(120 32 32)" />
      </g>
      <circle cx="32" cy="32" r="6" class="nucleus" />
    </svg>
    @if (showName()) {
      <span class="name">Atom</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .orbit {
      stroke: var(--mat-sys-primary);
    }
    .nucleus {
      fill: var(--mat-sys-tertiary);
    }
    .name {
      font: var(--mat-sys-title-large);
      font-family: var(--mat-sys-headline-large-font);
      letter-spacing: -0.01em;
    }
  `,
})
export class Logo {
  readonly size = input(32);
  readonly showName = input(true);
}
