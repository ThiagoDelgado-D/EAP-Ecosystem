import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ApiError, NETWORK_ERROR } from '@core/errors/api-error';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { AuthStore } from '@features/auth/application/auth.store';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import { CAPABILITY_KEY, MODULE_KEY } from '@features/auth/domain/auth.model';
import { INTAKE_GOAL, STUDY_STYLE, type IntakeAnswers } from '@features/auth/domain/intake.model';
import { IntakeHttpService } from '@features/auth/infrastructure/intake-http.service';
import {
  LONG_SESSIONS_GOAL_MINUTES,
  examPrepAnswers,
  examPrepSetup,
} from '@features/auth/infrastructure/mocks/intake.fixture';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { mockPreferencesRepository } from '@features/settings/application/mocks/mock-preferences.repository';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { WeeklyGoalService } from '@features/settings/application/weekly-goal.service';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import { IntakeRetakeComponent } from './intake-retake.component';

const OFFLINE_STATUS = 0;
const CURRENT_MODULES = [MODULE_KEY.RECOMMENDATION];

const habitAnswers: IntakeAnswers = {
  goals: [INTAKE_GOAL.BUILD_HABIT],
  studyStyle: STUDY_STYLE.SHORT_BLOCKS,
};

describe('IntakeRetakeComponent', () => {
  const intakeService = { previewSetup: vi.fn(), applyIntake: vi.fn() };
  let fixture: ComponentFixture<IntakeRetakeComponent>;
  let component: IntakeRetakeComponent;
  let preferencesService: PreferencesService;
  let weeklyGoal: WeeklyGoalService;

  async function retakeAs(answers: IntakeAnswers): Promise<void> {
    component.onGoalsSubmit(answers.goals);
    await component.onStyleSubmit([answers.studyStyle]);
  }

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        PreferencesService,
        WeeklyGoalService,
        { provide: PreferencesRepository, useValue: mockPreferencesRepository() },
        { provide: IntakeHttpService, useValue: intakeService },
      ],
    });
    TestBed.inject(AuthStore).currentUser.set(learner('Ada'));
    preferencesService = TestBed.inject(PreferencesService);
    preferencesService.enabledModules.set(CURRENT_MODULES);
    weeklyGoal = TestBed.inject(WeeklyGoalService);
    fixture = TestBed.createComponent(IntakeRetakeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('answered', habitAnswers);
    fixture.detectChanges();
  });

  test('starts from the answers the learner gave before', () => {
    expect(component.goals()).toEqual(habitAnswers.goals);
    expect(component.studyStyle()).toBe(habitAnswers.studyStyle);
  });

  test('previews the setup composed from the new answers', async () => {
    intakeService.previewSetup.mockResolvedValue(examPrepSetup);

    await retakeAs(examPrepAnswers);

    expect(intakeService.previewSetup).toHaveBeenCalledWith(examPrepAnswers);
    expect(component.step()).toBe('setup');
  });

  test('compares the proposal with the modules and goal the learner has now', () => {
    expect(component.current()).toEqual({
      enabledModules: CURRENT_MODULES,
      weeklyGoalMinutes: WEEKLY_GOAL_MINUTES.DEFAULT,
    });
  });

  test('applies the new answers and adopts the setup the server stored', async () => {
    const applied = vi.fn();
    component.applied.subscribe(applied);
    intakeService.previewSetup.mockResolvedValue(examPrepSetup);
    intakeService.applyIntake.mockResolvedValue({
      intake: examPrepAnswers,
      enabledModules: examPrepSetup.enabledModules,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
      capabilities: capabilitiesEnabling(examPrepSetup.enabledModules),
    });
    await retakeAs(examPrepAnswers);

    await component.onSetupConfirm({
      enabledModules: examPrepSetup.enabledModules,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });

    expect(intakeService.applyIntake).toHaveBeenCalledWith(examPrepAnswers, {
      enabledModules: examPrepSetup.enabledModules,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });
    expect(preferencesService.enabledModules()).toEqual(examPrepSetup.enabledModules);
    expect(TestBed.inject(AuthStore).isEnabled(CAPABILITY_KEY.LEARNING_PATHS)).toBe(true);
    expect(weeklyGoal.goalMinutes()).toBe(LONG_SESSIONS_GOAL_MINUTES);
    expect(applied).toHaveBeenCalledWith(examPrepAnswers);
  });

  test('keeps the current setup and explains why when applying fails', async () => {
    const applied = vi.fn();
    component.applied.subscribe(applied);
    intakeService.previewSetup.mockResolvedValue(examPrepSetup);
    intakeService.applyIntake.mockRejectedValue(
      new ApiError(NETWORK_ERROR, OFFLINE_STATUS, undefined),
    );
    await retakeAs(examPrepAnswers);

    await component.onSetupConfirm({
      enabledModules: examPrepSetup.enabledModules,
      weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
    });

    expect(component.error()).toBe(ERROR_MESSAGES[NETWORK_ERROR]);
    expect(preferencesService.enabledModules()).toEqual(CURRENT_MODULES);
    expect(weeklyGoal.goalMinutes()).toBe(WEEKLY_GOAL_MINUTES.DEFAULT);
    expect(applied).not.toHaveBeenCalled();
  });

  test('closes on Escape', () => {
    const closed = vi.fn();
    component.closed.subscribe(closed);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toHaveBeenCalled();
  });
});
