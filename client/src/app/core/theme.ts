import { DOCUMENT } from '@angular/common';
import { effect, inject, Service, signal } from '@angular/core';

export type ColorScheme = 'light' | 'dark';

const THEME_KEY = 'atom.theme';

/**
 * Persists and applies the colour scheme. The first visit follows the OS
 * preference; after that the user's explicit choice wins.
 */
@Service()
export class Theme {
  private readonly document = inject(DOCUMENT);
  readonly scheme = signal<ColorScheme>(this.load());

  constructor() {
    effect(() => {
      const theme = this.scheme();
      const root = this.document.documentElement;
      root.classList.toggle('theme-light', theme === 'light');
      root.classList.toggle('theme-dark', theme === 'dark');
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        // Storage may be unavailable (private mode); the theme still applies.
      }
    });
  }

  toggle(): void {
    this.scheme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private load(): ColorScheme {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Fall through to the OS preference.
    }
    const prefersDark = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    return prefersDark?.matches ? 'dark' : 'light';
  }
}
