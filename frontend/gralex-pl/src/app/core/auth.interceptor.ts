import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

const TOKEN_KEY = 'gralex_token';

/**
 * Attaches the JWT (when present) to every outgoing request and, on a 401,
 * clears the stale session and bounces the user to the login page. Kept as a
 * functional interceptor so it can be registered with provideHttpClient.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // An expired/invalid token surfaces as 401 on every guarded request.
      // Don't hijack the login call itself (a 401 there just means bad
      // credentials); for anything else, log out and send them to sign in.
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout();
        void router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    }),
  );
};
