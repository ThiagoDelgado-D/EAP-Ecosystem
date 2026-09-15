import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';

export const requireActiveSessionGuard: CanActivateFn = async () => {
  const store = inject(PomodoroSessionStore);
  const router = inject(Router);

  if (store.activeSession() || store.phase() === 'break') return true;

  const session = await store.rehydrate();
  if (!session && !store.activeBreak()) return router.createUrlTree(['/pomodoro']);

  return router.createUrlTree(['/dashboard']);
};

export const redirectIfActiveSessionGuard: CanActivateFn = async () => {
  const store = inject(PomodoroSessionStore);
  const router = inject(Router);

  if (store.activeSession() || store.phase() === 'break')
    return router.createUrlTree(['/pomodoro/active']);

  const session = await store.rehydrate();
  if (!session && !store.activeBreak()) return true;

  return router.createUrlTree(['/dashboard']);
};
