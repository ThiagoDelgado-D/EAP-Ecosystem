import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '@core/config/api.config';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { OnboardingHttpService } from './onboarding-http.service';
import { LONG_SESSIONS_GOAL_MINUTES, examPrepAnswers, examPrepSetup } from './mocks/intake.fixture';

const ONBOARDING_URL = `${API_CONFIG.baseUrl}/auth/onboarding`;

describe('OnboardingHttpService.completeOnboarding', () => {
  let onboardingHttp: OnboardingHttpService;
  let httpController: HttpTestingController;
  const onboardedLearner = learner('Ada');
  const completedOnboarding = {
    id: onboardedLearner.id,
    email: onboardedLearner.email,
    firstName: onboardedLearner.firstName,
    onboardingCompleted: true,
    enabledModules: examPrepSetup.enabledModules,
    capabilities: capabilitiesEnabling(examPrepSetup.enabledModules),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    onboardingHttp = TestBed.inject(OnboardingHttpService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('sends the intake answers and the confirmed weekly goal with the setup', async () => {
    const completion = onboardingHttp.completeOnboarding({
      firstName: onboardedLearner.firstName,
      enabledModules: examPrepSetup.enabledModules,
      intake: examPrepAnswers,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });
    const request = httpController.expectOne(ONBOARDING_URL);
    request.flush(completedOnboarding);

    expect(request.request.body).toEqual({
      firstName: onboardedLearner.firstName,
      enabledModules: examPrepSetup.enabledModules,
      intake: examPrepAnswers,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });
    expect((await completion).onboardingCompleted).toBe(true);
  });

  test('leaves the intake and weekly goal out when the learner skipped the intake', async () => {
    const completion = onboardingHttp.completeOnboarding({
      firstName: onboardedLearner.firstName,
      enabledModules: examPrepSetup.enabledModules,
    });
    const request = httpController.expectOne(ONBOARDING_URL);
    request.flush(completedOnboarding);
    await completion;

    const sentBody = JSON.parse(request.request.serializeBody() as string);
    expect(sentBody).toStrictEqual({
      firstName: onboardedLearner.firstName,
      enabledModules: examPrepSetup.enabledModules,
    });
  });
});
