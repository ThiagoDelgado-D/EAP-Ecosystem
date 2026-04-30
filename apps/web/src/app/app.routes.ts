import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/presentation/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'onboarding',
    loadChildren: () =>
      import('@features/auth/presentation/auth.routes').then((m) => m.onboardingRoutes),
  },
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
