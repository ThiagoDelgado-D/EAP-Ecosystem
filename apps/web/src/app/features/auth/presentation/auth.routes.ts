import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'sign-in',
        loadComponent: () => import('./sign-in/sign-in.component').then((m) => m.SignInComponent),
      },
      {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./oauth-callback/oauth-callback.component').then((m) => m.OAuthCallbackComponent),
  },
];

export const onboardingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./onboarding/onboarding.component').then((m) => m.OnboardingComponent),
      },
    ],
  },
];
