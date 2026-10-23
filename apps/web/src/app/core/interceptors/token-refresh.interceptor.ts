import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '@features/auth/application/auth.store';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/sign-out')) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const authHttp = inject(AuthHttpService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return from(authHttp.refresh()).pipe(
        switchMap((result) => {
          authStore.setSession(result.user, result.accessToken);

          const retried = req.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${result.accessToken}` },
          });
          return next(retried);
        }),
        catchError((refreshError: unknown) => {
          authStore.clearSession();
          void router.navigate(['/auth/sign-in']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
