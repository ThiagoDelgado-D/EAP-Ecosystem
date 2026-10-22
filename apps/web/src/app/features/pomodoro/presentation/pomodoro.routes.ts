import { Routes } from '@angular/router';
import { capabilityGuard } from '@core/guards/capability.guard';
import { CAPABILITY_KEY } from '@features/auth/domain/auth.model';
import { redirectIfActiveSessionGuard, requireActiveSessionGuard } from './guards/active-session.guards';

export const pomodoroRoutes: Routes = [
  {
    path: '',
    title: 'Pomodoro',
    children: [
      {
        path: '',
        canActivate: [redirectIfActiveSessionGuard, capabilityGuard(CAPABILITY_KEY.POMODORO)],
        loadComponent: () => import('./start/start.component').then((m) => m.StartComponent),
      },
      {
        path: 'active',
        title: 'Focus Session',
        canActivate: [requireActiveSessionGuard],
        loadComponent: () => import('./active/active.component').then((m) => m.ActiveComponent),
      },
      {
        path: 'end',
        title: 'Session Complete',
        canActivate: [requireActiveSessionGuard],
        loadComponent: () => import('./end/end.component').then((m) => m.EndComponent),
      },
      {
        path: 'summary',
        title: 'Weekly Summary',
        canActivate: [capabilityGuard(CAPABILITY_KEY.POMODORO_WEEKLY_SUMMARY)],
        loadComponent: () =>
          import('./summary/weekly-summary.component').then((m) => m.WeeklySummaryComponent),
      },
    ],
  },
];
