import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { OPTIONAL_MODULES } from '@features/auth/domain/auth.model';
import { IntakeHttpService } from '@features/auth/infrastructure/intake-http.service';
import { OnboardingHttpService } from '@features/auth/infrastructure/onboarding-http.service';
import {
  LONG_SESSIONS_GOAL_MINUTES,
  examPrepAnswers,
  examPrepSetup,
} from '@features/auth/infrastructure/mocks/intake.fixture';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { ApiError, NETWORK_ERROR } from '@core/errors/api-error';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { OnboardingComponent } from './onboarding.component';

const LEARNER_NAME = 'Ada';
const OFFLINE_STATUS = 0;

describe('OnboardingComponent', () => {
  const intakeService = { previewSetup: vi.fn() };
  const onboardingService = { completeOnboarding: vi.fn() };
  const onboardedLearner = learner(LEARNER_NAME);
  let component: OnboardingComponent;
  let navigate: ReturnType<typeof vi.spyOn>;

  async function answerIntake(): Promise<void> {
    component.onNameSubmit(LEARNER_NAME);
    component.onGoalsSubmit(examPrepAnswers.goals);
    await component.onStyleSubmit([examPrepAnswers.studyStyle]);
  }

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: IntakeHttpService, useValue: intakeService },
        { provide: OnboardingHttpService, useValue: onboardingService },
      ],
    });
    TestBed.inject(AuthStore).setSession(learner(LEARNER_NAME), crypto.randomUUID());
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component = TestBed.createComponent(OnboardingComponent).componentInstance;
  });

  test('starts from the name and email the learner signed in with', () => {
    const signedIn = TestBed.inject(AuthStore).currentUser()!;

    expect(component.firstName()).toBe(signedIn.firstName);
    expect(component.email).toBe(signedIn.email);
  });

  test('previews the setup composed from the answers', async () => {
    intakeService.previewSetup.mockResolvedValue(examPrepSetup);

    await answerIntake();

    expect(intakeService.previewSetup).toHaveBeenCalledWith(examPrepAnswers);
    expect(component.setup()).toEqual(examPrepSetup);
    expect(component.step()).toBe('setup');
  });

  test('stays on the study style with the reason when the preview fails', async () => {
    intakeService.previewSetup.mockRejectedValue(
      new ApiError(NETWORK_ERROR, OFFLINE_STATUS, undefined),
    );

    await answerIntake();

    expect(component.step()).toBe('style');
    expect(component.error()).toBe(ERROR_MESSAGES[NETWORK_ERROR]);
  });

  test('completes onboarding with the answers and the setup the learner confirmed', async () => {
    intakeService.previewSetup.mockResolvedValue(examPrepSetup);
    onboardingService.completeOnboarding.mockResolvedValue(onboardedLearner);
    await answerIntake();

    await component.onSetupConfirm({
      enabledModules: examPrepSetup.enabledModules,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });

    expect(onboardingService.completeOnboarding).toHaveBeenCalledWith({
      firstName: LEARNER_NAME,
      enabledModules: examPrepSetup.enabledModules,
      intake: examPrepAnswers,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });
    expect(TestBed.inject(AuthStore).currentUser()).toEqual(onboardedLearner);
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  test('completes onboarding with every module on when the learner skips the intake', async () => {
    onboardingService.completeOnboarding.mockResolvedValue(onboardedLearner);
    component.onNameSubmit(LEARNER_NAME);

    await component.onSkip();

    expect(onboardingService.completeOnboarding).toHaveBeenCalledWith({
      firstName: LEARNER_NAME,
      enabledModules: [...OPTIONAL_MODULES],
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  test('keeps the confirmed setup on screen when completing fails', async () => {
    intakeService.previewSetup.mockResolvedValue(examPrepSetup);
    onboardingService.completeOnboarding.mockRejectedValue(
      new ApiError(NETWORK_ERROR, OFFLINE_STATUS, undefined),
    );
    await answerIntake();

    await component.onSetupConfirm({
      enabledModules: examPrepSetup.enabledModules,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });

    expect(component.step()).toBe('setup');
    expect(component.error()).toBe(ERROR_MESSAGES[NETWORK_ERROR]);
    expect(navigate).not.toHaveBeenCalled();
  });

  test('clears an error when the learner moves to another step', async () => {
    intakeService.previewSetup.mockRejectedValue(
      new ApiError(NETWORK_ERROR, OFFLINE_STATUS, undefined),
    );
    await answerIntake();

    component.goTo('goals');

    expect(component.error()).toBeNull();
  });
});
