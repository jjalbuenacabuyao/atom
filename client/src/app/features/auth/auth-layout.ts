import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Logo } from '../../shared/logo';

/** Split-screen layout for the sign-in and registration pages. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Logo],
  template: `
    <div class="grid min-h-dvh min-[960px]:grid-cols-[minmax(400px,5fr)_6fr]">
      <aside
        class="hidden flex-col gap-8 bg-[radial-gradient(circle_at_20%_10%,var(--mat-sys-primary-container),transparent_60%),var(--mat-sys-surface-container)] p-12 text-on-surface min-[960px]:flex"
        aria-hidden="true"
      >
        <app-logo [size]="44" />
        <div class="mt-auto">
          <p class="my-4 eyebrow">Tiny changes · Remarkable results</p>
          <h2 class="mt-2 mb-4 type-display-medium tracking-[-0.02em]">Get 1% better every day.</h2>
          <p class="my-4 max-w-[42ch] type-body-large text-on-surface-variant">
            Improve by just one percent each day and you will be nearly
            <strong>37 times better</strong> by the end of the year. Atom helps you design habits
            that stick using the Four Laws of Behavior Change.
          </p>
        </div>
        <svg
          class="h-35 w-full fill-none stroke-3 [stroke-linecap:round] [&_path]:[vector-effect:non-scaling-stroke]"
          viewBox="0 0 365 120"
          preserveAspectRatio="none"
        >
          <path [attr.d]="better" class="stroke-primary" />
          <path [attr.d]="worse" class="stroke-error" />
        </svg>
        <div class="flex gap-6 type-label-large text-on-surface-variant">
          <span class="inline-flex items-center gap-2"
            ><i class="inline-block size-3 rounded-full bg-primary"></i>1.01<sup>365</sup> =
            37.78</span
          >
          <span class="inline-flex items-center gap-2"
            ><i class="inline-block size-3 rounded-full bg-error"></i>0.99<sup>365</sup> =
            0.03</span
          >
        </div>
      </aside>
      <main class="grid place-items-center px-4 py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AuthLayout {
  protected readonly better = curve(1.01);
  protected readonly worse = curve(0.99);
}

/** Builds an SVG path of rate^day for a year, scaled into a 365×120 box. */
function curve(rate: number): string {
  const maxValue = Math.pow(1.01, 365);
  const points: string[] = [];
  for (let day = 0; day <= 365; day += 5) {
    const y = 120 - (Math.pow(rate, day) / maxValue) * 112 - 4;
    points.push(`${day === 0 ? 'M' : 'L'}${day},${y.toFixed(1)}`);
  }
  return points.join(' ');
}
