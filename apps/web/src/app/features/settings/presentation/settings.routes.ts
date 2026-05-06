import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./settings-layout/settings-layout.component').then(
        (m) => m.SettingsLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'account', pathMatch: 'full' },
      {
        path: 'account',
        loadComponent: () =>
          import('./account/account.component').then((m) => m.AccountComponent),
      },
      {
        path: 'preferences',
        loadComponent: () =>
          import('./preferences/preferences.component').then((m) => m.PreferencesComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'modules',
        loadComponent: () =>
          import('./modules/modules.component').then((m) => m.ModulesComponent),
      },
      {
        path: 'widgets',
        loadComponent: () =>
          import('./widgets/widgets.component').then((m) => m.WidgetsComponent),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./sessions/sessions.component').then((m) => m.SessionsComponent),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./security/security.component').then((m) => m.SecurityComponent),
      },
      {
        path: 'import-export',
        loadComponent: () =>
          import('./import-export/import-export.component').then(
            (m) => m.ImportExportComponent,
          ),
      },
      {
        path: 'danger-zone',
        loadComponent: () =>
          import('./danger-zone/danger-zone.component').then((m) => m.DangerZoneComponent),
      },
    ],
  },
];
