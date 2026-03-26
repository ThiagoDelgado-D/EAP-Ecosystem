import { Routes } from '@angular/router';

export const learningResourceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-resource/add-resource.component').then((m) => m.AddResourceComponent),
  },
];
