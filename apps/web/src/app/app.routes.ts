import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/presentation/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'onboarding',
    title: 'Welcome',
    canActivate: [authGuard],
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
