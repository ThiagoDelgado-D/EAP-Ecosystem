import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';

export const requireActiveSessionGuard: CanActivateFn = async () => {
  const store = inject(PomodoroSessionStore);
  const router = inject(Router);

  if (store.activeSession()) return true;

  const session = await store.rehydrate();
  return session ? true : router.createUrlTree(['/pomodoro']);
};

export const redirectIfActiveSessionGuard: CanActivateFn = async () => {
  const store = inject(PomodoroSessionStore);
  const router = inject(Router);

  if (store.activeSession()) return router.createUrlTree(['/pomodoro/active']);

  const session = await store.rehydrate();
  return session ? router.createUrlTree(['/pomodoro/active']) : true;
};
