import type { ModuleKey, OptionalModuleKey } from './auth.model';

export const INTAKE_GOAL = {
  PASS_EXAM: 'pass-exam',
  PREPARE_INTERVIEW: 'prepare-interview',
  MASTER_TOPIC: 'master-topic',
  ORGANIZE_BACKLOG: 'organize-backlog',
  BUILD_HABIT: 'build-habit',
  EXPLORE: 'explore',
} as const;

export type IntakeGoal = (typeof INTAKE_GOAL)[keyof typeof INTAKE_GOAL];

export const STUDY_STYLE = {
  DAY_BY_DAY: 'day-by-day',
  SHORT_BLOCKS: 'short-blocks',
  LONG_SESSIONS: 'long-sessions',
  STRUCTURED_SCHEDULE: 'structured-schedule',
} as const;

export type StudyStyle = (typeof STUDY_STYLE)[keyof typeof STUDY_STYLE];

export type IntakeAnswer = IntakeGoal | StudyStyle;

export interface IntakeAnswers {
  goals: IntakeGoal[];
  studyStyle: StudyStyle;
}

export const WEEKLY_GOAL_SETTING = 'weekly-goal';

export type SetupSetting = ModuleKey | typeof WEEKLY_GOAL_SETTING;

export interface SetupReason {
  setting: SetupSetting;
  answers: IntakeAnswer[];
}

export interface ComposedSetup {
  enabledModules: OptionalModuleKey[];
  weeklyGoalMinutes: number;
  reasons: SetupReason[];
}
