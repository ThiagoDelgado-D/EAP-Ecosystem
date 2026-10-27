import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { messageOf } from '@core/errors/error-messages';
import { ToastService } from '@core/toast/toast.service';
import type {
  ComposedSetup,
  ConfirmedSetup,
  IntakeAnswers,
  IntakeGoal,
  StudyStyle,
} from '@features/auth/domain/intake.model';
import { IntakeHttpService } from '@features/auth/infrastructure/intake-http.service';
import { IntakeStepComponent } from '@features/auth/presentation/onboarding/intake-step/intake-step.component';
import {
  GOAL_OPTIONS,
  STUDY_STYLE_OPTIONS,
} from '@features/auth/presentation/onboarding/intake-options';
import { OnboardingProgressComponent } from '@features/auth/presentation/onboarding/onboarding-progress/onboarding-progress.component';
import { SetupStepComponent } from '@features/auth/presentation/onboarding/setup-step/setup-step.component';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { WeeklyGoalService } from '@features/settings/application/weekly-goal.service';

const STEPS = ['goals', 'style', 'setup'] as const;

type RetakeStep = (typeof STEPS)[number];

@Component({
  selector: 'app-intake-retake',
  standalone: true,
  imports: [IntakeStepComponent, SetupStepComponent, OnboardingProgressComponent],
  templateUrl: './intake-retake.component.html',
})
export class IntakeRetakeComponent {
  private readonly intakeService = inject(IntakeHttpService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly weeklyGoal = inject(WeeklyGoalService);
  private readonly toast = inject(ToastService);

  readonly answered = input<IntakeAnswers | null>(null);
  readonly closed = output<void>();
  readonly applied = output<IntakeAnswers>();

  readonly STEPS = STEPS;
  readonly GOAL_OPTIONS = GOAL_OPTIONS;
  readonly STUDY_STYLE_OPTIONS = STUDY_STYLE_OPTIONS;
  readonly step = signal<RetakeStep>('goals');
  readonly stepNumber = computed(() => STEPS.indexOf(this.step()) + 1);
  readonly goals = linkedSignal<IntakeGoal[]>(() => this.answered()?.goals ?? []);
  readonly studyStyle = linkedSignal<StudyStyle | null>(() => this.answered()?.studyStyle ?? null);
  readonly answeredStyle = computed(() => {
    const studyStyle = this.studyStyle();
    return studyStyle ? [studyStyle] : [];
  });
  readonly setup = signal<ComposedSetup | null>(null);
  readonly current = computed<ConfirmedSetup>(() => ({
    enabledModules: this.preferencesService.enabledModules(),
    weeklyGoalMinutes: this.weeklyGoal.goalMinutes(),
  }));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly retakeDialog = viewChild.required<ElementRef<HTMLDialogElement>>('retakeDialog');

  constructor() {
    afterNextRender(() => this.retakeDialog().nativeElement.showModal?.());
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  close(): void {
    if (this.loading()) return;
    this.closed.emit();
  }

  goTo(step: RetakeStep): void {
    this.error.set(null);
    this.step.set(step);
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
    this.loading.set(true);
    this.error.set(null);
    try {
      const applied = await this.intakeService.applyIntake(
        { goals: this.goals(), studyStyle },
        confirmed,
      );
      this.preferencesService.adoptModulePreferences({
        enabledModules: applied.enabledModules,
        capabilities: applied.capabilities,
      });
      this.weeklyGoal.goalMinutes.set(applied.weeklyGoalMinutes);
      this.toast.show('Your setup was updated.');
      this.applied.emit(applied.intake);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }
}
