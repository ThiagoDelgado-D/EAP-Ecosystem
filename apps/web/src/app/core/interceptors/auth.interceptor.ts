import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthStore } from '@features/auth/application/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).accessToken();
  const cloned = token
    ? req.clone({ withCredentials: true, setHeaders: { Authorization: `Bearer ${token}` } })
    : req.clone({ withCredentials: true });
  return next(cloned);
};
