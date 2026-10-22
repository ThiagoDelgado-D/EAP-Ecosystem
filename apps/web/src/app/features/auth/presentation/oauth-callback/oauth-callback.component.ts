import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';
import { isOptionalModule, type OptionalModuleKey } from '@features/auth/domain/auth.model';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center">
      <p class="text-ink-dim text-sm">Signing you in...</p>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly authHttp = inject(AuthHttpService);

  async ngOnInit(): Promise<void> {
    const fragment = this.route.snapshot.fragment;
    const params = new URLSearchParams(fragment ?? '');
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const userId = params.get('user_id');
    const email = params.get('email');
    const enabledModules = this.parseEnabledModules(params.get('enabled_modules'));

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
        enabledModules,
        capabilities: {},
      },
      accessToken,
    );
    await this.loadModulePreferences();

    if (onboarding) {
      this.router.navigate(['/onboarding'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  private async loadModulePreferences(): Promise<void> {
    try {
      this.authStore.updateModulePreferences(await this.authHttp.getModulePreferences());
    } catch {
      return;
    }
  }

  private parseEnabledModules(raw: string | null): OptionalModuleKey[] {
    if (!raw) return [];

    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(isOptionalModule);
  }
}
