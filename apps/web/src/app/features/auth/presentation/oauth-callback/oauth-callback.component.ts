import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center">
      <p class="text-slate-400 text-sm">Signing you in...</p>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    const fragment = this.route.snapshot.fragment;
    const params = new URLSearchParams(fragment ?? '');
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const userId = params.get('user_id');
    const email = params.get('email');

    if (error || !accessToken || !userId || !email) {
      this.router.navigate(['/auth/sign-in'], { replaceUrl: true });
      return;
    }

    const onboarding = params.get('onboarding') === 'true';

    this.authStore.setSession(
      {
        id: userId,
        email,
        firstName: params.get('first_name') ?? '',
        lastName: params.get('last_name') ?? '',
        onboardingCompleted: !onboarding,
        featureConfig: [],
      },
      accessToken,
    );

    if (onboarding) {
      this.router.navigate(['/onboarding'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
