import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { INTAKE_GOAL, STUDY_STYLE, type IntakeAnswer } from '@features/auth/domain/intake.model';
import { GOAL_OPTIONS, STUDY_STYLE_OPTIONS, type IntakeOption } from '../intake-options';
import { IntakeStepComponent } from './intake-step.component';

const QUESTION_EYEBROW = 'First, what matters to you';
const QUESTION_TITLE = 'What are you here for?';
const QUESTION_SUBTITLE = 'Pick as many as you like.';

describe('IntakeStepComponent', () => {
  let fixture: ComponentFixture<IntakeStepComponent<IntakeAnswer>>;
  let component: IntakeStepComponent<IntakeAnswer>;

  function askWith(options: readonly IntakeOption<IntakeAnswer>[], multiple: boolean): void {
    fixture = TestBed.createComponent<IntakeStepComponent<IntakeAnswer>>(IntakeStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('eyebrow', QUESTION_EYEBROW);
    fixture.componentRef.setInput('title', QUESTION_TITLE);
    fixture.componentRef.setInput('subtitle', QUESTION_SUBTITLE);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('multiple', multiple);
    fixture.detectChanges();
  }

  test('keeps several goals in the order the options are listed', () => {
    askWith(GOAL_OPTIONS, true);

    component.choose(INTAKE_GOAL.BUILD_HABIT);
    component.choose(INTAKE_GOAL.PASS_EXAM);

    expect(component.chosen()).toEqual([INTAKE_GOAL.PASS_EXAM, INTAKE_GOAL.BUILD_HABIT]);
  });

  test('drops a goal chosen a second time', () => {
    askWith(GOAL_OPTIONS, true);

    component.choose(INTAKE_GOAL.EXPLORE);
    component.choose(INTAKE_GOAL.EXPLORE);

    expect(component.chosen()).toEqual([]);
  });

  test('replaces the study style when another one is chosen', () => {
    askWith(STUDY_STYLE_OPTIONS, false);

    component.choose(STUDY_STYLE.SHORT_BLOCKS);
    component.choose(STUDY_STYLE.LONG_SESSIONS);

    expect(component.chosen()).toEqual([STUDY_STYLE.LONG_SESSIONS]);
  });

  test('starts from the answers already given', () => {
    askWith(GOAL_OPTIONS, true);

    fixture.componentRef.setInput('answered', [INTAKE_GOAL.MASTER_TOPIC]);

    expect(component.chosen()).toEqual([INTAKE_GOAL.MASTER_TOPIC]);
  });

  test('sends the chosen answers on continue', () => {
    askWith(GOAL_OPTIONS, true);
    const answer = vi.fn();
    component.answer.subscribe(answer);

    component.choose(INTAKE_GOAL.ORGANIZE_BACKLOG);
    component.submit();

    expect(answer).toHaveBeenCalledWith([INTAKE_GOAL.ORGANIZE_BACKLOG]);
  });

  test("doesn't continue without an answer", () => {
    askWith(GOAL_OPTIONS, true);
    const answer = vi.fn();
    component.answer.subscribe(answer);

    component.submit();

    expect(answer).not.toHaveBeenCalled();
  });

  test('offers skipping only when the question allows it', () => {
    askWith(GOAL_OPTIONS, true);
    const skipLink = () =>
      [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
        button.textContent?.includes('Skip'),
      );
    expect(skipLink()).toBeUndefined();

    fixture.componentRef.setInput('skippable', true);
    fixture.detectChanges();

    expect(skipLink()).toBeDefined();
  });
});
