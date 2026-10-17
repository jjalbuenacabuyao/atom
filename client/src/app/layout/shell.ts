import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { Logo } from '../shared/logo';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    Logo,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected readonly user = this.auth.user;
  protected readonly initials = computed(() =>
    (this.user()?.name ?? '?')
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );

  protected readonly isCompact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 839.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly isDark = computed(() => this.theme.theme() === 'dark');

  protected readonly nav: NavItem[] = [
    { path: '/today', label: 'Today', icon: 'today' },
    { path: '/habits', label: 'Habits', icon: 'bolt' },
    { path: '/identity', label: 'Identity', icon: 'person_heart' },
    { path: '/scorecard', label: 'Scorecard', icon: 'checklist' },
    { path: '/guide', label: 'Four Laws', icon: 'menu_book' },
  ];

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
