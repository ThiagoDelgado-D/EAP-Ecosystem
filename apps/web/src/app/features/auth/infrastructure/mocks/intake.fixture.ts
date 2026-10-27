import { API_CONFIG } from '@core/config/api.config';
import { MODULE_KEY } from '@features/auth/domain/auth.model';
import {
  INTAKE_GOAL,
  STUDY_STYLE,
  WEEKLY_GOAL_SETTING,
  type ComposedSetup,
  type IntakeAnswers,
} from '@features/auth/domain/intake.model';

export const INTAKE_URL = `${API_CONFIG.baseUrl}/preferences/intake`;
export const INTAKE_PREVIEW_URL = `${INTAKE_URL}/preview`;

export const LONG_SESSIONS_GOAL_MINUTES = 900;

export const examPrepAnswers: IntakeAnswers = {
  goals: [INTAKE_GOAL.PASS_EXAM, INTAKE_GOAL.MASTER_TOPIC],
  studyStyle: STUDY_STYLE.LONG_SESSIONS,
};

export const examPrepSetup: ComposedSetup = {
  enabledModules: [MODULE_KEY.LEARNING_PATHS, MODULE_KEY.POMODORO],
  weeklyGoalMinutes: LONG_SESSIONS_GOAL_MINUTES,
  reasons: [
    {
      setting: MODULE_KEY.LEARNING_PATHS,
      answers: [INTAKE_GOAL.PASS_EXAM, INTAKE_GOAL.MASTER_TOPIC],
    },
    { setting: MODULE_KEY.POMODORO, answers: [INTAKE_GOAL.PASS_EXAM, STUDY_STYLE.LONG_SESSIONS] },
    { setting: WEEKLY_GOAL_SETTING, answers: [STUDY_STYLE.LONG_SESSIONS] },
  ],
};
