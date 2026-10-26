import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import {
  OnboardingHttpService,
  type CompleteOnboardingRequest,
} from '@features/auth/infrastructure/onboarding-http.service';
import { IntakeHttpService } from '@features/auth/infrastructure/intake-http.service';
import { OPTIONAL_MODULES } from '@features/auth/domain/auth.model';
import type { ComposedSetup, IntakeGoal, StudyStyle } from '@features/auth/domain/intake.model';
import { messageOf } from '@core/errors/error-messages';
import { NameStepComponent } from './name-step/name-step.component';
import { IntakeStepComponent } from './intake-step/intake-step.component';
import { SetupStepComponent, type ConfirmedSetup } from './setup-step/setup-step.component';
import { OnboardingProgressComponent } from './onboarding-progress/onboarding-progress.component';
import { GOAL_OPTIONS, STUDY_STYLE_OPTIONS } from './intake-options';

const STEPS = ['name', 'goals', 'style', 'setup'] as const;

type OnboardingStep = (typeof STEPS)[number];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    NameStepComponent,
    IntakeStepComponent,
    SetupStepComponent,
    OnboardingProgressComponent,
  ],
  templateUrl: './onboarding.component.html',
})
export class OnboardingComponent {
  private readonly onboardingService = inject(OnboardingHttpService);
  private readonly intakeService = inject(IntakeHttpService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly STEPS = STEPS;
  readonly GOAL_OPTIONS = GOAL_OPTIONS;
  readonly STUDY_STYLE_OPTIONS = STUDY_STYLE_OPTIONS;
  readonly step = signal<OnboardingStep>('name');
  readonly stepNumber = computed(() => STEPS.indexOf(this.step()) + 1);
  readonly firstName = signal('');
  readonly goals = signal<IntakeGoal[]>([]);
  readonly studyStyle = signal<StudyStyle | null>(null);
  readonly answeredStyle = computed(() => {
    const studyStyle = this.studyStyle();
    return studyStyle ? [studyStyle] : [];
  });
  readonly setup = signal<ComposedSetup | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  goTo(step: OnboardingStep): void {
    this.error.set(null);
    this.step.set(step);
  }

  onNameSubmit(name: string): void {
    this.firstName.set(name);
    this.goTo('goals');
  }

  onGoalsSubmit(goals: IntakeGoal[]): void {
    this.goals.set(goals);
    this.goTo('style');
  }

  async onStyleSubmit([studyStyle]: StudyStyle[]): Promise<void> {
    this.studyStyle.set(studyStyle);
    this.loading.set(true);
    this.error.set(null);
    try {
      this.setup.set(await this.intakeService.previewSetup({ goals: this.goals(), studyStyle }));
      this.goTo('setup');
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }

  async onSetupConfirm(confirmed: ConfirmedSetup): Promise<void> {
    const studyStyle = this.studyStyle();
    if (!studyStyle) return;
    await this.complete({
      firstName: this.firstName(),
      enabledModules: confirmed.enabledModules,
      intake: { goals: this.goals(), studyStyle },
      weeklyGoalMinutes: confirmed.weeklyGoalMinutes,
    });
  }

  async onSkip(): Promise<void> {
    await this.complete({ firstName: this.firstName(), enabledModules: [...OPTIONAL_MODULES] });
  }

  private async complete(request: CompleteOnboardingRequest): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const user = await this.onboardingService.completeOnboarding(request);
      this.authStore.setSession(user, this.authStore.accessToken()!);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }
}
