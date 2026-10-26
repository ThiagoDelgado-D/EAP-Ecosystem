import {
  INTAKE_GOAL,
  STUDY_STYLE,
  type IntakeAnswer,
  type IntakeGoal,
  type StudyStyle,
} from '@features/auth/domain/intake.model';
import type { Tone } from '@shared/utils/tone';

export interface IntakeOption<T extends IntakeAnswer> {
  key: T;
  label: string;
  hint: string;
  glyph: string;
  tone: Tone;
  reason: string;
}

export const GOAL_OPTIONS: readonly IntakeOption<IntakeGoal>[] = [
  {
    key: INTAKE_GOAL.PASS_EXAM,
    label: 'Pass an exam',
    hint: 'I have a date and a syllabus.',
    glyph: '◎',
    tone: 'ember',
    reason: "you're preparing for an exam",
  },
  {
    key: INTAKE_GOAL.PREPARE_INTERVIEW,
    label: 'Prepare for an interview',
    hint: 'Technical, system design or in another language.',
    glyph: '◆',
    tone: 'info',
    reason: "you're preparing for an interview",
  },
  {
    key: INTAKE_GOAL.MASTER_TOPIC,
    label: 'Master a topic',
    hint: 'No deadline, I want to really get it.',
    glyph: '❡',
    tone: 'pine',
    reason: 'you want to master a topic',
  },
  {
    key: INTAKE_GOAL.ORGANIZE_BACKLOG,
    label: 'Organize what I already have',
    hint: 'Links, courses and books scattered everywhere.',
    glyph: '▤',
    tone: 'ochre',
    reason: 'you want to organize what you saved',
  },
  {
    key: INTAKE_GOAL.BUILD_HABIT,
    label: 'Build a study habit',
    hint: 'I want to study regularly.',
    glyph: '↻',
    tone: 'plum',
    reason: "you're building a study habit",
  },
  {
    key: INTAKE_GOAL.EXPLORE,
    label: 'Explore without pressure',
    hint: 'Out of curiosity, no guilt.',
    glyph: '✦',
    tone: 'slate',
    reason: "you're exploring without pressure",
  },
];

export const STUDY_STYLE_OPTIONS: readonly IntakeOption<StudyStyle>[] = [
  {
    key: STUDY_STYLE.DAY_BY_DAY,
    label: 'I adapt day by day',
    hint: 'Recommendations propose, you choose what fits.',
    glyph: '✦',
    tone: 'plum',
    reason: 'you adapt day by day',
  },
  {
    key: STUDY_STYLE.SHORT_BLOCKS,
    label: 'Short blocks',
    hint: '20–40 minutes, several times a week.',
    glyph: '◷',
    tone: 'pine',
    reason: 'you study in short blocks',
  },
  {
    key: STUDY_STYLE.LONG_SESSIONS,
    label: 'Long sessions',
    hint: '50–90 minutes of focus in one go.',
    glyph: '◐',
    tone: 'ember',
    reason: 'you like long sessions',
  },
  {
    key: STUDY_STYLE.STRUCTURED_SCHEDULE,
    label: 'A structured schedule',
    hint: 'Dates and a clear plan to follow.',
    glyph: '▤',
    tone: 'info',
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
