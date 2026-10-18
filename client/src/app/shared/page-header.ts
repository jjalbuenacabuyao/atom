import { Component, input } from '@angular/core';

/**
 * Standard page header: eyebrow, emphasized title and supporting text, with
 * projected actions aligned to the end.
 */
@Component({
  selector: 'app-page-header',
  template: `
    <div class="min-w-0">
      @if (eyebrow()) {
        <span class="eyebrow">{{ eyebrow() }}</span>
      }
      <h1 class="type-display-small-emphasized">{{ heading() }}</h1>
      @if (subtitle()) {
        <p class="mt-1 type-body-large text-on-surface-variant">{{ subtitle() }}</p>
      }
    </div>
    <ng-content />
  `,
  host: { class: 'mb-6 flex flex-wrap items-end justify-between gap-4' },
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly eyebrow = input('');
  readonly subtitle = input('');
}
