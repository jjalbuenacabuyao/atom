import { Component, inject, input, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { toServerErrors } from '../../shared/form-errors';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'app-login',
  imports: [
    FormField,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    Logo,
  ],
  templateUrl: './login.html',
  styleUrl: './auth-form.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the `?returnUrl=` query parameter. */
  readonly returnUrl = input<string>();

  protected readonly hidePassword = signal(true);
  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (p) => {
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
    required(p.password, { message: 'Password is required' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.loginForm, async () => {
      try {
        await this.auth.login(this.model());
      } catch (err) {
        return toServerErrors(this.loginForm, err);
      }
      await this.router.navigateByUrl(this.safeReturnUrl());
      return undefined;
    });
  }

  /** Only follow same-app relative URLs to avoid open redirects. */
  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/today';
  }
}
