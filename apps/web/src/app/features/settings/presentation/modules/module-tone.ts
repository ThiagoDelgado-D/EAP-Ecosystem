import { MODULE_KEY, type ModuleKey } from '@features/auth/domain/auth.model';
import { type Tone } from '@shared/utils/tone';

export const MODULE_TONE: Record<ModuleKey, Tone> = {
  [MODULE_KEY.RESOURCE_LIBRARY]: 'pine',
  [MODULE_KEY.LEARNING_PATHS]: 'info',
  [MODULE_KEY.POMODORO]: 'ember',
  [MODULE_KEY.RECOMMENDATION]: 'plum',
};
