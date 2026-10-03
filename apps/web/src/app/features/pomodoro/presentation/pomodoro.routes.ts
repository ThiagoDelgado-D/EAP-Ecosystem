import { Routes } from '@angular/router';
import { redirectIfActiveSessionGuard, requireActiveSessionGuard } from './guards/active-session.guards';

export const pomodoroRoutes: Routes = [
  {
    path: '',
    title: 'Pomodoro',
    children: [
      {
        path: '',
        canActivate: [redirectIfActiveSessionGuard],
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
        loadComponent: () =>
          import('./summary/weekly-summary.component').then((m) => m.WeeklySummaryComponent),
      },
    ],
  },
];
