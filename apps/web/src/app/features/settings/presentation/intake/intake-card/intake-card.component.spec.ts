import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ApiError, NETWORK_ERROR } from '@core/errors/api-error';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { INTAKE_GOAL, STUDY_STYLE, type IntakeAnswers } from '@features/auth/domain/intake.model';
import { IntakeHttpService } from '@features/auth/infrastructure/intake-http.service';
import { examPrepAnswers } from '@features/auth/infrastructure/mocks/intake.fixture';
import {
  GOAL_OPTIONS,
  STUDY_STYLE_OPTIONS,
} from '@features/auth/presentation/onboarding/intake-options';
import { IntakeCardComponent } from './intake-card.component';

const OFFLINE_STATUS = 0;

const habitAnswers: IntakeAnswers = {
  goals: [INTAKE_GOAL.BUILD_HABIT],
  studyStyle: STUDY_STYLE.SHORT_BLOCKS,
};

const labelOf = (key: string) =>
  [...GOAL_OPTIONS, ...STUDY_STYLE_OPTIONS].find((option) => option.key === key)!.label;

describe('IntakeCardComponent', () => {
  const intakeService = { getIntake: vi.fn() };
  let fixture: ComponentFixture<IntakeCardComponent>;
  let component: IntakeCardComponent;

  async function showWith(intake: Promise<IntakeAnswers | null>): Promise<void> {
    intakeService.getIntake.mockReturnValue(intake);
    fixture = TestBed.createComponent(IntakeCardComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  }

  const retakeButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button.btn-primary');

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: IntakeHttpService, useValue: intakeService }],
    });
  });

  test('lists the goals and study style the learner answered', async () => {
    await showWith(Promise.resolve(examPrepAnswers));

    const answers = fixture.nativeElement.querySelector('[aria-label="Your answers"]').textContent;
    for (const answer of [...examPrepAnswers.goals, examPrepAnswers.studyStyle]) {
      expect(answers).toContain(labelOf(answer));
    }
    expect(retakeButton().textContent).toContain('Retake the intake');
  });

  test('offers taking the intake to a learner who skipped it', async () => {
    await showWith(Promise.resolve(null));

    expect(component.answers()).toEqual([]);
    expect(retakeButton().textContent).toContain('Take the intake');
  });

  test("explains why the answers couldn't load and doesn't offer a retake", async () => {
    await showWith(Promise.reject(new ApiError(NETWORK_ERROR, OFFLINE_STATUS, undefined)));

    expect(component.error()).toBe(ERROR_MESSAGES[NETWORK_ERROR]);
    expect(retakeButton().disabled).toBe(true);
  });

  test('shows the retaken answers and closes the retake once applied', async () => {
    await showWith(Promise.resolve(examPrepAnswers));
    component.retaking.set(true);

    component.onApplied(habitAnswers);

    expect(component.intake()).toEqual(habitAnswers);
    expect(component.retaking()).toBe(false);
  });
});
