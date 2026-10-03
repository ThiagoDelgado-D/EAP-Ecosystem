import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const learningResourceRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@core/layout/shell-layout.component.js').then((m) => m.ShellLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'resources',
        title: 'Resources',
        loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'add/guided',
        title: 'Add Resource',
        loadComponent: () =>
          import('./add-resource/guided/guided-form.component').then((m) => m.GuidedFormComponent),
      },
      {
        path: 'add/url',
        title: 'Import from URL',
        loadComponent: () =>
          import('./add-resource/url-import/url-import.component').then(
            (m) => m.UrlImportComponent,
          ),
      },
      {
        path: 'add/voice',
        title: 'Voice Capture',
        loadComponent: () =>
          import('./add-resource/voice/voice-capture.component').then(
            (m) => m.VoiceCaptureComponent,
          ),
      },
      {
        path: 'add/import',
        title: 'Import File',
        loadComponent: () =>
          import('./add-resource/file-import/file-import.component').then(
            (m) => m.FileImportComponent,
          ),
      },
      {
        path: 'add',
        title: 'Add Resource',
        loadComponent: () =>
          import('./add-resource/add-resource-hub.component').then(
            (m) => m.AddResourceHubComponent,
          ),
      },
      {
        path: 'resources/:id/edit',
        title: 'Edit Resource',
        loadComponent: () =>
          import('./edit-resource/edit-resource.component').then((m) => m.EditResourceComponent),
      },
      {
        path: 'resources/:id',
        title: 'Resource',
        loadComponent: () =>
          import('./resource-detail/resource-detail.component').then(
            (m) => m.ResourceDetailComponent,
          ),
      },
      {
        path: 'settings',
        title: 'Settings',
        loadChildren: () =>
          import('@features/settings/presentation/settings.routes').then((m) => m.settingsRoutes),
      },
      {
        path: 'paths',
        loadChildren: () =>
          import('@features/learning-path/presentation/learning-path.routes').then(
            (m) => m.learningPathRoutes,
          ),
      },
      {
        path: 'pomodoro',
        loadChildren: () =>
          import('@features/pomodoro/presentation/pomodoro.routes').then((m) => m.pomodoroRoutes),
      },
    ],
  },
];
