import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { OnboardingHttpService } from '@features/auth/infrastructure/onboarding-http.service';
import { OptionalModuleKey } from '@features/auth/domain/auth.model';
import { messageOf } from '@core/errors/error-messages';
import { NameStepComponent } from './name-step/name-step.component';
import { ModulesStepComponent } from './modules-step/modules-step.component';

type OnboardingStep = 'name' | 'modules';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [NameStepComponent, ModulesStepComponent],
  templateUrl: './onboarding.component.html',
})
export class OnboardingComponent {
  private readonly onboardingService = inject(OnboardingHttpService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly step = signal<OnboardingStep>('name');
  readonly firstName = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onNameSubmit(name: string): void {
    this.firstName.set(name);
    this.step.set('modules');
  }

  async onModulesSubmit(enabledModules: OptionalModuleKey[]): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const user = await this.onboardingService.completeOnboarding({
        firstName: this.firstName(),
        enabledModules,
      });
      this.authStore.setSession(user, this.authStore.accessToken()!);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }
}
