import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@features/learning-resource/presentation/learning-resource.routes').then(
        (m) => m.learningResourceRoutes,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
