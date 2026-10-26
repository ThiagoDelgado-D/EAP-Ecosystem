import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { MODULE_KEY } from '@features/auth/domain/auth.model';
import { INTAKE_GOAL, STUDY_STYLE } from '@features/auth/domain/intake.model';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import {
  LONG_SESSIONS_GOAL_MINUTES,
  examPrepSetup,
} from '@features/auth/infrastructure/mocks/intake.fixture';
import { minutesLabel } from '@shared/utils/minutes-label';
import { reasonFor } from '../intake-options';
import { SetupStepComponent } from './setup-step.component';

const SETUP_TITLE = "Here's your setup, Ada.";
const CURRENT_GOAL_MINUTES = WEEKLY_GOAL_MINUTES.DEFAULT;
const ADJUSTED_GOAL_MINUTES = LONG_SESSIONS_GOAL_MINUTES - WEEKLY_GOAL_MINUTES.STEP;

describe('SetupStepComponent', () => {
  let fixture: ComponentFixture<SetupStepComponent>;
  let component: SetupStepComponent;

  const blockFor = (label: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`button[aria-label^="${label}"]`);
  const reasonLabels = () => component.reasons().map((reason) => reason.label);

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', SETUP_TITLE);
    fixture.componentRef.setInput('setup', examPrepSetup);
    fixture.detectChanges();
  });

  test('starts from the proposed modules and weekly goal', () => {
    expect(component.isOn(MODULE_KEY.LEARNING_PATHS)).toBe(true);
    expect(component.isOn(MODULE_KEY.POMODORO)).toBe(true);
    expect(component.isOn(MODULE_KEY.RECOMMENDATION)).toBe(false);
    expect(component.goalMinutes()).toBe(LONG_SESSIONS_GOAL_MINUTES);
  });

  test('explains each proposed module and the weekly goal', () => {
    expect(component.reasons()).toEqual([
      {
        label: 'Learning Paths',
        detail: reasonFor([INTAKE_GOAL.PASS_EXAM, INTAKE_GOAL.MASTER_TOPIC]),
        tone: expect.any(String),
      },
      {
        label: 'Pomodoro',
        detail: reasonFor([INTAKE_GOAL.PASS_EXAM, STUDY_STYLE.LONG_SESSIONS]),
        tone: expect.any(String),
      },
      {
        label: `${minutesLabel(LONG_SESSIONS_GOAL_MINUTES)} a week`,
        detail: reasonFor([STUDY_STYLE.LONG_SESSIONS]),
        tone: expect.any(String),
      },
    ]);
  });

  test('gives no reason for a module the learner turned on', () => {
    blockFor('Recommendations').click();

    expect(component.isOn(MODULE_KEY.RECOMMENDATION)).toBe(true);
    expect(reasonLabels()).not.toContain('Recommendations');
  });

  test('drops the reason of a module the learner turned off', () => {
    blockFor('Pomodoro').click();

    expect(reasonLabels()).not.toContain('Pomodoro');
  });

  test('drops the weekly goal reason once the learner changes the goal', () => {
    component.goalMinutes.set(ADJUSTED_GOAL_MINUTES);

    expect(reasonLabels()).not.toContain(`${minutesLabel(LONG_SESSIONS_GOAL_MINUTES)} a week`);
  });

  test('keeps the resource library on', () => {
    blockFor('Resource Library').click();

    expect(component.isOn(MODULE_KEY.RESOURCE_LIBRARY)).toBe(true);
  });

  test('confirms the adjusted modules in catalog order with the adjusted goal', () => {
    const confirm = vi.fn();
    component.confirm.subscribe(confirm);

    blockFor('Recommendations').click();
    blockFor('Learning Paths').click();
    component.goalMinutes.set(ADJUSTED_GOAL_MINUTES);
    component.submit();

    expect(confirm).toHaveBeenCalledWith({
      enabledModules: [MODULE_KEY.POMODORO, MODULE_KEY.RECOMMENDATION],
      weeklyGoalMinutes: ADJUSTED_GOAL_MINUTES,
    });
  });

  describe('against the current setup', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('current', {
        enabledModules: [MODULE_KEY.POMODORO, MODULE_KEY.RECOMMENDATION],
        weeklyGoalMinutes: CURRENT_GOAL_MINUTES,
      });
      fixture.detectChanges();
    });

    test('marks a module the proposal turns on and one it turns off', () => {
      expect(component.changeOf(MODULE_KEY.LEARNING_PATHS)).toBe('new');
      expect(component.changeOf(MODULE_KEY.RECOMMENDATION)).toBe('off');
      expect(component.changeOf(MODULE_KEY.POMODORO)).toBeNull();
      expect(blockFor('Learning Paths').getAttribute('aria-label')).toBe('Learning Paths (new)');
    });

    test('drops the mark once the learner puts a module back as it was', () => {
      blockFor('Recommendations').click();

      expect(component.changeOf(MODULE_KEY.RECOMMENDATION)).toBeNull();
    });

    test('shows the weekly goal it replaces', () => {
      expect(component.previousGoalMinutes()).toBe(CURRENT_GOAL_MINUTES);

      component.goalMinutes.set(CURRENT_GOAL_MINUTES);

      expect(component.previousGoalMinutes()).toBeNull();
    });
  });

  test('marks no changes without a current setup to compare with', () => {
    expect(component.changeOf(MODULE_KEY.LEARNING_PATHS)).toBeNull();
    expect(component.previousGoalMinutes()).toBeNull();
  });
});
