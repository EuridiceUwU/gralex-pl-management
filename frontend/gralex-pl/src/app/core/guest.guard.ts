import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

// Keeps an already-authenticated user off the login screen (direct URL, back
// button, etc.) by sending them back into the app instead.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(
    auth.mustChangePassword() ? ['/admin/change-password'] : ['/admin/dashboard'],
  );
};
