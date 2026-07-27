import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

// Blocks the main app while the user still has a temporary password, forcing
// them to the change-password screen first. Registered on the `admin` node
// alongside authGuard.
export const passwordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.mustChangePassword()) {
    return router.createUrlTree(['/admin/change-password']);
  }

  return true;
};

// Guards the change-password screen itself: only reachable while a change is
// actually pending, otherwise send the user back to the dashboard.
export const changePasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.mustChangePassword()) {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};
