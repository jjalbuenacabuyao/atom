import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';

describe('auth guards', () => {
  const signedIn = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthenticated: signedIn } }],
    });
  });

  const run = (guard: typeof authGuard, url = '/habits') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  it('redirects anonymous users to login with a return URL', () => {
    signedIn.set(false);
    const result = run(authGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fhabits');
  });

  it('lets signed-in users through', () => {
    signedIn.set(true);
    expect(run(authGuard)).toBe(true);
  });

  it('sends signed-in users away from guest pages', () => {
    signedIn.set(true);
    const result = run(guestGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/today');
  });
});
