import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';
import { EmailStepComponent } from './email-step/email-step.component';
import { CodeStepComponent } from './code-step/code-step.component';
import { SuccessStepComponent } from './success-step/success-step.component';

type SignInStep = 'email' | 'code' | 'success';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [EmailStepComponent, CodeStepComponent, SuccessStepComponent],
  templateUrl: './sign-in.component.html',
})
export class SignInComponent implements OnDestroy {
  private readonly authService = inject(AuthHttpService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly step = signal<SignInStep>('email');
  readonly email = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  async onEmailSubmit(email: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.requestSignIn(email);
      this.email.set(email);
      this.step.set('code');
    } catch {
      this.error.set('Failed to send sign-in code. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async onCodeSubmit(code: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.authService.verifySignIn(this.email(), code);
      this.authStore.setSession(result.user, result.accessToken);
      if (!result.user.onboardingCompleted) {
        await this.router.navigate(['/onboarding']);
      } else {
        this.step.set('success');
        this.redirectTimer = setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      }
    } catch {
      this.error.set('Invalid or expired code. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  onChangeEmail(): void {
    this.step.set('email');
    this.error.set(null);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }
}
