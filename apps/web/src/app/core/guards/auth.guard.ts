import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { type AnyApiError, isApiError } from '@core/errors/api-error';
import { messageFor } from '@core/errors/error-messages';
import { ToastService } from '@core/toast/toast.service';
import { AuthStore } from '@features/auth/application/auth.store';
import {
  AuthHttpService,
  isSessionRejected,
  type VerifySignInResult,
} from '@features/auth/infrastructure/auth-http.service';

export const REFRESH_RETRY_DELAYS_MS: readonly number[] = [1000, 2000];
export const MAX_REFRESH_RETRY_AFTER_MS = 5000;

export const authGuard: CanActivateFn = async () => {
  const store = inject(AuthStore);
  const authHttp = inject(AuthHttpService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (store.isAuthenticated()) return true;

  try {
    const result = await refreshRetryingTransientFailures(authHttp);
    store.setSession(result.user, result.accessToken);
    return true;
  } catch (refreshError) {
    if (isApiError(refreshError) && !isSessionRejected(refreshError)) {
      toast.show(messageFor(refreshError), 'error');
    }
    return router.createUrlTree(['/auth/sign-in']);
  }
};

async function refreshRetryingTransientFailures(
  authHttp: AuthHttpService,
): Promise<VerifySignInResult> {
  for (const delayMs of REFRESH_RETRY_DELAYS_MS) {
    try {
      return await authHttp.refresh();
    } catch (refreshError) {
      if (isSessionRejected(refreshError)) throw refreshError;
      await wait(retryDelayMs(refreshError, delayMs));
    }
  }
  return authHttp.refresh();
}

function retryDelayMs(refreshError: unknown, backoffMs: number): number {
  if (!isApiError(refreshError) || !isRateLimited(refreshError)) return backoffMs;
  const retryAfterSeconds = refreshError.context?.retryAfterSeconds;
  if (!retryAfterSeconds) return backoffMs;
  return Math.min(retryAfterSeconds * 1000, MAX_REFRESH_RETRY_AFTER_MS);
}

function isRateLimited(
  error: AnyApiError,
): error is Extract<AnyApiError, { name: 'TOO_MANY_REQUESTS_ERROR' }> {
  return error.name === 'TOO_MANY_REQUESTS_ERROR';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
