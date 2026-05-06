import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';

export const authGuard: CanActivateFn = async () => {
  const store = inject(AuthStore);
  const authHttp = inject(AuthHttpService);
  const router = inject(Router);

  if (store.isAuthenticated()) return true;

  try {
    const result = await authHttp.refresh();
    store.setSession(result.user, result.accessToken);
    return true;
  } catch {
    return router.createUrlTree(['/auth/sign-in']);
  }
};
