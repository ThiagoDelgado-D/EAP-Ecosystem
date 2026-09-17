import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';

export const requireActiveSessionGuard: CanActivateFn = async (route) => {
  const store = inject(PomodoroSessionStore);
  const router = inject(Router);

  if (store.activeSession() || store.phase() === 'break') return true;

  if (store.justAutoClosed()) {
    return route.routeConfig?.path === 'end' ? true : router.createUrlTree(['/pomodoro/end']);
  }

  const session = await store.rehydrate();

  if (store.justAutoClosed()) {
    return route.routeConfig?.path === 'end' ? true : router.createUrlTree(['/pomodoro/end']);
  }
  if (!session && !store.activeBreak()) return router.createUrlTree(['/pomodoro']);

  return router.createUrlTree(['/dashboard']);
};

export const redirectIfActiveSessionGuard: CanActivateFn = async () => {
  const store = inject(PomodoroSessionStore);
  const router = inject(Router);

  if (store.activeSession() || store.phase() === 'break')
    return router.createUrlTree(['/pomodoro/active']);

  if (store.justAutoClosed()) return router.createUrlTree(['/pomodoro/end']);

  const session = await store.rehydrate();
  if (store.justAutoClosed()) return router.createUrlTree(['/pomodoro/end']);
  if (!session && !store.activeBreak()) return true;

  return router.createUrlTree(['/dashboard']);
};
