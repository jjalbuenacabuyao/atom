import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api';
import type { Credentials, Registration, User } from './models/user';

/**
 * Holds the signed-in user. The session itself lives in an HttpOnly cookie
 * managed by the server, so no token is ever exposed to JavaScript.
 */
@Service()
export class Session {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/auth`;

  private readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly firstName = computed(() => this.currentUser()?.name.split(' ')[0] ?? '');

  /** Restores an existing session on startup. Never throws. */
  async restoreSession(): Promise<void> {
    try {
      this.currentUser.set(await firstValueFrom(this.http.get<User>(`${this.base}/me`)));
    } catch {
      this.currentUser.set(null);
    }
  }

  async login(credentials: Credentials): Promise<User> {
    const user = await firstValueFrom(this.http.post<User>(`${this.base}/login`, credentials));
    this.currentUser.set(user);
    return user;
  }

  async register(registration: Registration): Promise<User> {
    const user = await firstValueFrom(this.http.post<User>(`${this.base}/register`, registration));
    this.currentUser.set(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post<void>(`${this.base}/logout`, null));
    } finally {
      this.currentUser.set(null);
    }
  }

  /** Forgets the user locally, e.g. after the server reports an expired session. */
  clear(): void {
    this.currentUser.set(null);
  }
}
