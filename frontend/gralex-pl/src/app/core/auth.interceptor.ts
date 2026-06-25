import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'gralex_token';

/**
 * Attaches the JWT (when present) to every outgoing request. Kept as a
 * functional interceptor so it can be registered with provideHttpClient.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req);
};
