import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import type { CapabilityKey } from '@features/auth/domain/auth.model';

export const capabilityGuard =
  (key: CapabilityKey): CanActivateFn =>
  () => {
    if (inject(AuthStore).isEnabled(key)) return true;

    return inject(Router).createUrlTree(['/dashboard']);
  };
