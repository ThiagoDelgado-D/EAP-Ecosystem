import { Routes } from '@angular/router';

export const learningResourceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
];
