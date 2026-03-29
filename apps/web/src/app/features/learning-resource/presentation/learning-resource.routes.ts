import { Routes } from '@angular/router';

export const learningResourceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-resource/add-resource-hub.component').then((m) => m.AddResourceHubComponent),
  },
  {
    path: 'add/guided',
    loadComponent: () =>
      import('./add-resource/guided/guided-form.component').then((m) => m.GuidedFormComponent),
  },
  {
    path: 'add/url',
    loadComponent: () =>
      import('./add-resource/url-import/url-import.component').then((m) => m.UrlImportComponent),
  },
  {
    path: 'add/voice',
    loadComponent: () =>
      import('./add-resource/voice/voice-capture.component').then((m) => m.VoiceCaptureComponent),
  },
  {
    path: 'add/import',
    loadComponent: () =>
      import('./add-resource/file-import/file-import.component').then((m) => m.FileImportComponent),
  },
];
