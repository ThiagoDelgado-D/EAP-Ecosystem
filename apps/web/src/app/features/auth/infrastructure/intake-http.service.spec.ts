import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IntakeHttpService } from './intake-http.service';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import {
  INTAKE_PREVIEW_URL,
  INTAKE_URL,
  LONG_SESSIONS_GOAL_MINUTES,
  examPrepAnswers,
  examPrepSetup,
} from './mocks/intake.fixture';

describe('IntakeHttpService', () => {
  let intakeHttp: IntakeHttpService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    intakeHttp = TestBed.inject(IntakeHttpService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('sends the answers and returns the setup composed from them', async () => {
    const preview = intakeHttp.previewSetup(examPrepAnswers);
    const request = httpController.expectOne(INTAKE_PREVIEW_URL);
    request.flush(examPrepSetup);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(examPrepAnswers);
    expect(await preview).toEqual(examPrepSetup);
  });

  test('reads the answers the learner gave', async () => {
    const stored = intakeHttp.getIntake();
    httpController.expectOne(INTAKE_URL).flush({ intake: examPrepAnswers });

    expect(await stored).toEqual(examPrepAnswers);
  });

  test('reads no answers for a learner who skipped the intake', async () => {
    const stored = intakeHttp.getIntake();
    httpController.expectOne(INTAKE_URL).flush({ intake: null });

    expect(await stored).toBeNull();
  });

  test('applies the retaken answers with the setup the learner confirmed', async () => {
    const confirmed = {
      enabledModules: examPrepSetup.enabledModules,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    };
    const appliedIntake = {
      intake: examPrepAnswers,
      enabledModules: confirmed.enabledModules,
      weeklyGoalMinutes: confirmed.weeklyGoalMinutes,
      capabilities: capabilitiesEnabling(confirmed.enabledModules),
    };

    const applying = intakeHttp.applyIntake(examPrepAnswers, confirmed);
    const request = httpController.expectOne(INTAKE_URL);
    request.flush(appliedIntake);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      intake: examPrepAnswers,
      enabledModules: confirmed.enabledModules,
      weeklyGoalMinutes: confirmed.weeklyGoalMinutes,
    });
    expect(await applying).toEqual(appliedIntake);
  });
});
