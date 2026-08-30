import { Routes } from '@angular/router';

export const learningPathRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/learning-path-list.component').then((m) => m.LearningPathListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/learning-path-detail.component').then(
        (m) => m.LearningPathDetailComponent,
      ),
  },
];
