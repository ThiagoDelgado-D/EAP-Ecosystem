import { MODULE_KEY, type ModuleKey } from '@features/auth/domain/auth.model';

export type BadgeVariant = 'live' | `v${string}`;

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  iconPath: string;
  badge: BadgeVariant;
  alwaysOn?: boolean;
  isCore?: boolean;
}

export const MODULE_CATALOG: ModuleDefinition[] = [
  {
    key: MODULE_KEY.RESOURCE_LIBRARY,
    label: 'Resource Library',
    description:
      'Your learning catalog — add resources via URL, voice, file import, or guided form. Tag by topic, difficulty, energy, and mental state.',
    iconPath: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    badge: 'live',
    alwaysOn: true,
    isCore: true,
  },
  {
    key: MODULE_KEY.LEARNING_PATHS,
    label: 'Learning Paths',
    description:
      'Curated sequences and maps of nodes — link resources from your library, or leave stubs to fill in later. Sequential or graph mode.',
    iconPath: 'M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6zM12 12v9M12 6V3',
    badge: 'v0.9',
  },
  {
    key: MODULE_KEY.POMODORO,
    label: 'Pomodoro',
    description:
      'Built-in focus timer, integrated with session tracking. Configurable session and break durations.',
    iconPath: 'M12 6v6l4 2M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z',
    badge: 'v0.9.5',
  },
  {
    key: MODULE_KEY.RECOMMENDATION,
    label: 'Recommendations',
    description:
      'Suggests what to study next from your library and paths, matched to your energy, mental state, and available time.',
    iconPath:
      'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
    badge: 'v0.10',
  },
];
