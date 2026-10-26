export const IntakeGoal = {
  PASS_EXAM: "pass-exam",
  PREPARE_INTERVIEW: "prepare-interview",
  MASTER_TOPIC: "master-topic",
  ORGANIZE_BACKLOG: "organize-backlog",
  BUILD_HABIT: "build-habit",
  EXPLORE: "explore",
} as const;

export type IntakeGoal = (typeof IntakeGoal)[keyof typeof IntakeGoal];

export const StudyStyle = {
  DAY_BY_DAY: "day-by-day",
  SHORT_BLOCKS: "short-blocks",
  LONG_SESSIONS: "long-sessions",
  STRUCTURED_SCHEDULE: "structured-schedule",
} as const;

export type StudyStyle = (typeof StudyStyle)[keyof typeof StudyStyle];

export type IntakeAnswer = IntakeGoal | StudyStyle;

export interface IntakeAnswers {
  goals: IntakeGoal[];
  studyStyle: StudyStyle;
}
