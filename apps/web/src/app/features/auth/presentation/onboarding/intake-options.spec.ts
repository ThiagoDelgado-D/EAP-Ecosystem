import { INTAKE_GOAL, STUDY_STYLE, type IntakeAnswer } from '@features/auth/domain/intake.model';
import { GOAL_OPTIONS, STUDY_STYLE_OPTIONS, reasonFor } from './intake-options';

const reasonOf = (answer: IntakeAnswer) =>
  [...GOAL_OPTIONS, ...STUDY_STYLE_OPTIONS].find((option) => option.key === answer)!.reason;

describe('intake options', () => {
  test('offer every goal and every study style the intake accepts', () => {
    expect(GOAL_OPTIONS.map((option) => option.key)).toEqual(Object.values(INTAKE_GOAL));
    expect(STUDY_STYLE_OPTIONS.map((option) => option.key)).toEqual(Object.values(STUDY_STYLE));
  });
});

describe('reasonFor', () => {
  test('words a single answer as its own reason', () => {
    expect(reasonFor([STUDY_STYLE.LONG_SESSIONS])).toBe(reasonOf(STUDY_STYLE.LONG_SESSIONS));
  });

  test('joins two answers with "and"', () => {
    expect(reasonFor([INTAKE_GOAL.PASS_EXAM, STUDY_STYLE.SHORT_BLOCKS])).toBe(
      `${reasonOf(INTAKE_GOAL.PASS_EXAM)} and ${reasonOf(STUDY_STYLE.SHORT_BLOCKS)}`,
    );
  });

  test('lists three or more answers before the last "and"', () => {
    expect(
      reasonFor([INTAKE_GOAL.PASS_EXAM, INTAKE_GOAL.BUILD_HABIT, STUDY_STYLE.SHORT_BLOCKS]),
    ).toBe(
      `${reasonOf(INTAKE_GOAL.PASS_EXAM)}, ${reasonOf(INTAKE_GOAL.BUILD_HABIT)} and ${reasonOf(STUDY_STYLE.SHORT_BLOCKS)}`,
    );
  });

  test('skips an answer the intake no longer offers', () => {
    const retiredAnswer = 'retired-answer' as IntakeAnswer;

    expect(reasonFor([retiredAnswer, INTAKE_GOAL.EXPLORE])).toBe(reasonOf(INTAKE_GOAL.EXPLORE));
  });
});
