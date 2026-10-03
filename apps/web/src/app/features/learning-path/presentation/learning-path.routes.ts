import { Routes } from '@angular/router';

export const learningPathRoutes: Routes = [
  {
    path: '',
    title: 'Paths',
    loadComponent: () =>
      import('./list/learning-path-list.component').then((m) => m.LearningPathListComponent),
  },
  {
    path: ':id',
    title: 'Path',
    loadComponent: () =>
      import('./detail/learning-path-detail.component').then(
        (m) => m.LearningPathDetailComponent,
      ),
  },
];
