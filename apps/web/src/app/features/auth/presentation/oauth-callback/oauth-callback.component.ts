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
    const params = this.route.snapshot.queryParamMap;
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error || !accessToken) {
      this.router.navigate(['/auth/sign-in']);
      return;
    }

    const onboarding = params.get('onboarding') === 'true';

    this.authStore.setSession(
      {
        id: params.get('user_id')!,
        email: params.get('email')!,
        firstName: params.get('first_name') ?? '',
        lastName: params.get('last_name') ?? '',
        onboardingCompleted: !onboarding,
        featureConfig: [],
      },
      accessToken,
    );

    if (onboarding) {
      this.router.navigate(['/onboarding']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
