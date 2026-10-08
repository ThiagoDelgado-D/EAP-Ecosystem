import { type FeatureKey } from '@features/auth/domain/auth.model';
import { type Tone } from '@shared/utils/tone';

export type ModuleKey =
  | FeatureKey
  | 'resource-library'
  | 'voice-capture'
  | 'file-import'
  | 'session-tracking'
  | 'browser-extension';

export const MODULE_TONE: Record<ModuleKey, Tone> = {
  'resource-library': 'pine',
  'voice-capture': 'pine',
  'file-import': 'pine',
  'learning-paths': 'info',
  'knowledge-graph': 'plum',
  pomodoro: 'ember',
  'session-tracking': 'ember',
  'spaced-repetition': 'ochre',
  'browser-extension': 'slate',
};
