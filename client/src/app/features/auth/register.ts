import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
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
  selector: 'app-register',
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
  templateUrl: './register.html',
  styleUrl: './auth-form.scss',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly hidePassword = signal(true);
  protected readonly model = signal({ name: '', email: '', password: '' });
  protected readonly registerForm = form(this.model, (p) => {
    required(p.name, { message: 'Tell us what to call you' });
    maxLength(p.name, 80, { message: 'Keep it under 80 characters' });
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
    required(p.password, { message: 'Password is required' });
    minLength(p.password, 8, { message: 'Use at least 8 characters' });
    maxLength(p.password, 72, { message: 'Use at most 72 characters' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.registerForm, async () => {
      try {
        await this.auth.register(this.model());
      } catch (err) {
        return toServerErrors(this.registerForm, err);
      }
      await this.router.navigate(['/identity'], { queryParams: { welcome: true } });
      return undefined;
    });
  }
}
