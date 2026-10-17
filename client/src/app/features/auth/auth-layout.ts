import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Logo } from '../../shared/logo';

/** Split-screen layout for the sign-in and registration pages. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Logo],
  template: `
    <div class="layout">
      <aside class="hero" aria-hidden="true">
        <app-logo [size]="44" />
        <div class="pitch">
          <p class="eyebrow">Tiny changes · Remarkable results</p>
          <h2>Get 1% better every day.</h2>
          <p>
            Improve by just one percent each day and you will be nearly
            <strong>37 times better</strong> by the end of the year. Atom helps you design habits
            that stick using the Four Laws of Behavior Change.
          </p>
        </div>
        <svg class="curve" viewBox="0 0 365 120" preserveAspectRatio="none">
          <path [attr.d]="better" class="up" />
          <path [attr.d]="worse" class="down" />
        </svg>
        <div class="legend">
          <span><i class="up"></i>1.01<sup>365</sup> = 37.78</span>
          <span><i class="down"></i>0.99<sup>365</sup> = 0.03</span>
        </div>
      </aside>
      <main class="panel">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './auth-layout.scss',
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
