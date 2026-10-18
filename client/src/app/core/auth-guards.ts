import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

/** Allows signed-in users through; sends everyone else to the login page. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(Session);
  if (session.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Keeps signed-in users away from the login and registration pages. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(Session);
  return session.isAuthenticated() ? inject(Router).createUrlTree(['/today']) : true;
};
