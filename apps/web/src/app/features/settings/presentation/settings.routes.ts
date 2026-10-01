import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./settings-layout/settings-layout.component').then(
        (m) => m.SettingsLayoutComponent,
      ),
  },
  { path: 'account', redirectTo: '', pathMatch: 'full' },
  { path: 'preferences', redirectTo: '', pathMatch: 'full' },
  { path: 'notifications', redirectTo: '', pathMatch: 'full' },
  { path: 'modules', redirectTo: '', pathMatch: 'full' },
  { path: 'widgets', redirectTo: '', pathMatch: 'full' },
  { path: 'pomodoro', redirectTo: '', pathMatch: 'full' },
  { path: 'sessions', redirectTo: '', pathMatch: 'full' },
  { path: 'security', redirectTo: '', pathMatch: 'full' },
  { path: 'import-export', redirectTo: '', pathMatch: 'full' },
  { path: 'danger-zone', redirectTo: '', pathMatch: 'full' },
];
