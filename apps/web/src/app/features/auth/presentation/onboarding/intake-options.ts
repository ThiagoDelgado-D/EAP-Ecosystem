import {
  INTAKE_GOAL,
  STUDY_STYLE,
  type IntakeAnswer,
  type IntakeGoal,
  type StudyStyle,
} from '@features/auth/domain/intake.model';

export interface IntakeOption<T extends IntakeAnswer> {
  key: T;
  label: string;
  hint: string;
  reason: string;
}

export const GOAL_OPTIONS: readonly IntakeOption<IntakeGoal>[] = [
  {
    key: INTAKE_GOAL.PASS_EXAM,
    label: 'Pass an exam',
    hint: 'Be ready by a date.',
    reason: "you're preparing for an exam",
  },
  {
    key: INTAKE_GOAL.PREPARE_INTERVIEW,
    label: 'Prepare for an interview',
    hint: 'Get sharp on what they will ask.',
    reason: "you're preparing for an interview",
  },
  {
    key: INTAKE_GOAL.MASTER_TOPIC,
    label: 'Master a topic',
    hint: 'Go deep, one step after another.',
    reason: 'you want to master a topic',
  },
  {
    key: INTAKE_GOAL.ORGANIZE_BACKLOG,
    label: 'Organize what I already have',
    hint: 'Links, courses and books piling up.',
    reason: 'you want to organize what you saved',
  },
  {
    key: INTAKE_GOAL.BUILD_HABIT,
    label: 'Build a study habit',
    hint: 'A little, often.',
    reason: "you're building a study habit",
  },
  {
    key: INTAKE_GOAL.EXPLORE,
    label: 'Explore without pressure',
    hint: 'Follow your curiosity.',
    reason: "you're exploring without pressure",
  },
];

export const STUDY_STYLE_OPTIONS: readonly IntakeOption<StudyStyle>[] = [
  {
    key: STUDY_STYLE.DAY_BY_DAY,
    label: 'Day by day',
    hint: 'Decide each day what fits.',
    reason: 'you adapt day by day',
  },
  {
    key: STUDY_STYLE.SHORT_BLOCKS,
    label: 'Short blocks',
    hint: 'Around half an hour at a time.',
    reason: 'you study in short blocks',
  },
  {
    key: STUDY_STYLE.LONG_SESSIONS,
    label: 'Long sessions',
    hint: 'An hour or more once you sit down.',
    reason: 'you like long sessions',
  },
  {
    key: STUDY_STYLE.STRUCTURED_SCHEDULE,
    label: 'A structured schedule',
    hint: 'A plan you follow week by week.',
    reason: 'you like a structured schedule',
  },
];

const REASON_BY_ANSWER = new Map<IntakeAnswer, string>(
  [...GOAL_OPTIONS, ...STUDY_STYLE_OPTIONS].map((option) => [option.key, option.reason]),
);

export function reasonFor(answers: readonly IntakeAnswer[]): string {
  const reasons = answers
    .map((answer) => REASON_BY_ANSWER.get(answer))
    .filter((reason) => reason !== undefined);
  if (reasons.length <= 1) return reasons.join('');
  return `${reasons.slice(0, -1).join(', ')} and ${reasons.at(-1)}`;
}
