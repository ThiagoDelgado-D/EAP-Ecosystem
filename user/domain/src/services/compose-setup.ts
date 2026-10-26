import { IntakeGoal, StudyStyle, type IntakeAnswers } from "../entities/intake.js";
import { ModuleKey, OPTIONAL_MODULES } from "../entities/module.js";
import { DEFAULT_APPEARANCE } from "../entities/user.js";

export interface ComposedSetup {
  enabledModules: ModuleKey[];
  weeklyGoalMinutes: number;
}

export const GOAL_MODULES: Record<IntakeGoal, readonly ModuleKey[]> = {
  [IntakeGoal.PASS_EXAM]: [ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO, ModuleKey.RECOMMENDATION],
  [IntakeGoal.PREPARE_INTERVIEW]: [
    ModuleKey.LEARNING_PATHS,
    ModuleKey.POMODORO,
    ModuleKey.RECOMMENDATION,
  ],
  [IntakeGoal.MASTER_TOPIC]: [ModuleKey.LEARNING_PATHS, ModuleKey.RECOMMENDATION],
  [IntakeGoal.ORGANIZE_BACKLOG]: [ModuleKey.RECOMMENDATION],
  [IntakeGoal.BUILD_HABIT]: [ModuleKey.POMODORO, ModuleKey.RECOMMENDATION],
  [IntakeGoal.EXPLORE]: [ModuleKey.RECOMMENDATION],
};

export const STUDY_STYLE_MODULES: Record<StudyStyle, readonly ModuleKey[]> = {
  [StudyStyle.DAY_BY_DAY]: [],
  [StudyStyle.SHORT_BLOCKS]: [ModuleKey.POMODORO],
  [StudyStyle.LONG_SESSIONS]: [ModuleKey.POMODORO],
  [StudyStyle.STRUCTURED_SCHEDULE]: [ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO],
};

export const STUDY_STYLE_WEEKLY_GOAL_MINUTES: Record<StudyStyle, number> = {
  [StudyStyle.DAY_BY_DAY]: DEFAULT_APPEARANCE.weeklyGoalMinutes,
  [StudyStyle.SHORT_BLOCKS]: 300,
  [StudyStyle.LONG_SESSIONS]: 900,
  [StudyStyle.STRUCTURED_SCHEDULE]: DEFAULT_APPEARANCE.weeklyGoalMinutes,
};

export const composeSetup = ({ goals, studyStyle }: IntakeAnswers): ComposedSetup => {
  const chosen = new Set<ModuleKey>([
    ...goals.flatMap((goal) => GOAL_MODULES[goal]),
    ...STUDY_STYLE_MODULES[studyStyle],
  ]);

  return {
    enabledModules: OPTIONAL_MODULES.filter((module) => chosen.has(module)),
    weeklyGoalMinutes: STUDY_STYLE_WEEKLY_GOAL_MINUTES[studyStyle],
  };
};
