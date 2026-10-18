import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** A suggestion: plain text, or a value shown with a different label/icon. */
export type Suggestion = string | { value: string; label: string; icon?: string };

let nextId = 0;

/**
 * A row of M3 suggestion chips. Picking one emits its value; the chip matching
 * the field's current value is hidden so only new ideas are offered.
 */
@Component({
  selector: 'app-suggestions',
  imports: [MatIconModule],
  template: `
    <span class="type-label-medium text-on-surface-variant" [id]="labelId">{{ label() }}</span>
    @for (item of visible(); track item.value) {
      <button
        type="button"
        class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-outline-variant bg-transparent px-3 type-label-large text-on-surface-variant transition-colors duration-150 hover:bg-on-surface/8 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary active:bg-on-surface/10"
        (click)="picked.emit(item.value)"
      >
        @if (item.icon) {
          <mat-icon aria-hidden="true" class="icon-4.5! text-primary">{{ item.icon }}</mat-icon>
        }
        {{ item.label }}
      </button>
    }
  `,
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
    // Toggle `flex`/`hidden` rather than layering them, so only one display utility applies.
    '[class.flex]': 'visible().length > 0',
    '[class.hidden]': 'visible().length === 0',
    class: 'flex-wrap items-center gap-2',
  },
})
export class Suggestions {
  readonly items = input.required<readonly Suggestion[]>();
  /** Lead-in text, also the group's accessible name. */
  readonly label = input('Try:');
  /** The field's current value; a matching suggestion is hidden. */
  readonly current = input('');
  readonly picked = output<string>();

  protected readonly labelId = `suggestions-${nextId++}`;

  protected readonly visible = computed(() => {
    const current = this.current().trim().toLowerCase();
    return this.items()
      .map((item) => (typeof item === 'string' ? { value: item, label: item } : item))
      .filter((item) => item.value.trim().toLowerCase() !== current);
  });
}
