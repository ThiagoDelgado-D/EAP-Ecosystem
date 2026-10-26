import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { MODULE_KEY } from '@features/auth/domain/auth.model';
import { INTAKE_GOAL, STUDY_STYLE } from '@features/auth/domain/intake.model';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import {
  LONG_SESSIONS_GOAL_MINUTES,
  examPrepSetup,
} from '@features/auth/infrastructure/mocks/intake.fixture';
import { reasonFor } from '../intake-options';
import { SetupStepComponent } from './setup-step.component';

const LEARNER_NAME = 'Ada';
const ADJUSTED_GOAL_MINUTES = LONG_SESSIONS_GOAL_MINUTES - WEEKLY_GOAL_MINUTES.STEP;

describe('SetupStepComponent', () => {
  let fixture: ComponentFixture<SetupStepComponent>;
  let component: SetupStepComponent;

  const cardFor = (label: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`button[aria-label^="${label}"]`);

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('firstName', LEARNER_NAME);
    fixture.componentRef.setInput('setup', examPrepSetup);
    fixture.detectChanges();
  });

  test('starts from the proposed modules and weekly goal', () => {
    expect(component.isOn(MODULE_KEY.LEARNING_PATHS)).toBe(true);
    expect(component.isOn(MODULE_KEY.POMODORO)).toBe(true);
    expect(component.isOn(MODULE_KEY.RECOMMENDATION)).toBe(false);
    expect(component.goalMinutes()).toBe(LONG_SESSIONS_GOAL_MINUTES);
  });

  test('shows why each proposed module is on', () => {
    expect(cardFor('Learning Paths').textContent).toContain(
      reasonFor([INTAKE_GOAL.PASS_EXAM, INTAKE_GOAL.MASTER_TOPIC]),
    );
    expect(cardFor('Pomodoro').textContent).toContain(
      reasonFor([INTAKE_GOAL.PASS_EXAM, STUDY_STYLE.LONG_SESSIONS]),
    );
  });

  test('shows why the weekly goal was proposed', () => {
    expect(component.goalReason()).toBe(reasonFor([STUDY_STYLE.LONG_SESSIONS]));
  });

  test('gives no reason for a module the learner turned on', () => {
    cardFor('Recommendations').click();
    fixture.detectChanges();

    expect(component.isOn(MODULE_KEY.RECOMMENDATION)).toBe(true);
    expect(cardFor('Recommendations').textContent).not.toContain('Because');
  });

  test('hides the reason of a module the learner turned off', () => {
    cardFor('Pomodoro').click();
    fixture.detectChanges();

    expect(cardFor('Pomodoro').textContent).not.toContain('Because');
  });

  test('keeps the resource library on', () => {
    cardFor('Resource Library').click();

    expect(component.isOn(MODULE_KEY.RESOURCE_LIBRARY)).toBe(true);
  });

  test('confirms the adjusted modules in catalog order with the adjusted goal', () => {
    const confirm = vi.fn();
    component.confirm.subscribe(confirm);

    cardFor('Recommendations').click();
    cardFor('Learning Paths').click();
    component.goalMinutes.set(ADJUSTED_GOAL_MINUTES);
    component.submit();

    expect(confirm).toHaveBeenCalledWith({
      enabledModules: [MODULE_KEY.POMODORO, MODULE_KEY.RECOMMENDATION],
      weeklyGoalMinutes: ADJUSTED_GOAL_MINUTES,
    });
  });
});
