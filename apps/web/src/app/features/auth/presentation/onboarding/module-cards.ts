import { MODULE_KEY, type ModuleKey } from '@features/auth/domain/auth.model';
import { MODULE_TONE } from '@features/settings/presentation/modules/module-tone';
import type { Tone } from '@shared/utils/tone';

export interface ModuleCard {
  key: ModuleKey;
  label: string;
  desc: string;
  glyph: string;
  tone: Tone;
  locked?: boolean;
}

export const MODULE_CARDS: readonly ModuleCard[] = [
  {
    key: MODULE_KEY.RESOURCE_LIBRARY,
    label: 'Resource Library',
    desc: 'Your catalog. Always on.',
    glyph: '▤',
    tone: MODULE_TONE[MODULE_KEY.RESOURCE_LIBRARY],
    locked: true,
  },
  {
    key: MODULE_KEY.LEARNING_PATHS,
    label: 'Learning Paths',
    desc: 'Routes with phases and steps.',
    glyph: '↗',
    tone: MODULE_TONE[MODULE_KEY.LEARNING_PATHS],
  },
  {
    key: MODULE_KEY.POMODORO,
    label: 'Pomodoro',
    desc: 'A focus timer tied to sessions.',
    glyph: '◷',
    tone: MODULE_TONE[MODULE_KEY.POMODORO],
  },
  {
    key: MODULE_KEY.RECOMMENDATION,
    label: 'Recommendations',
    desc: 'What to study next, for today.',
    glyph: '✦',
    tone: MODULE_TONE[MODULE_KEY.RECOMMENDATION],
  },
];
