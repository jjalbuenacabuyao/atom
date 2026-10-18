import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Session } from './session';

/**
 * Redirects to the login page when an authenticated request reports that the
 * session has expired.
 */
export const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(Session);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const isAuthCall = req.url.includes('/auth/');
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthCall) {
        session.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
