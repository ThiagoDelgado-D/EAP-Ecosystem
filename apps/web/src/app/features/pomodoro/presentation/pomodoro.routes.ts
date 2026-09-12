import { Routes } from '@angular/router';
import { redirectIfActiveSessionGuard, requireActiveSessionGuard } from './guards/active-session.guards';

export const pomodoroRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        canActivate: [redirectIfActiveSessionGuard],
        loadComponent: () => import('./start/start.component').then((m) => m.StartComponent),
      },
      {
        path: 'active',
        canActivate: [requireActiveSessionGuard],
        loadComponent: () => import('./active/active.component').then((m) => m.ActiveComponent),
      },
      {
        path: 'end',
        canActivate: [requireActiveSessionGuard],
        loadComponent: () => import('./end/end.component').then((m) => m.EndComponent),
      },
    ],
  },
];
