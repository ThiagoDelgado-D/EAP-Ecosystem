import { type FeatureKey } from '@features/auth/domain/auth.model';

export type BadgeVariant = 'live' | 'planned' | `v${string}`;

export type ModuleKey =
  | FeatureKey
  | 'resource-library'
  | 'voice-capture'
  | 'file-import'
  | 'session-tracking'
  | 'browser-extension';

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  iconPath: string;
  accentColor: string;
  badge: BadgeVariant;
  alwaysOn?: boolean;
  isCore?: boolean;
}

export const MODULE_CATALOG: ModuleDefinition[] = [
  {
    key: 'resource-library',
    label: 'Resource Library',
    description:
      'Your learning catalog — add resources via URL, voice, file import, or guided form. Tag by topic, difficulty, energy, and mental state.',
    iconPath: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    accentColor: '#a78bfa',
    badge: 'live',
    alwaysOn: true,
    isCore: true,
  },
  {
    key: 'learning-paths',
    label: 'Learning Paths',
    description:
      'Curated sequences and maps of nodes — link resources from your library, or leave stubs to fill in later. Sequential or graph mode.',
    iconPath: 'M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6zM12 12v9M12 6V3',
    accentColor: '#a78bfa',
    badge: 'v0.9',
  },
  {
    key: 'knowledge-graph',
    label: 'Atlas (Knowledge Graph)',
    description:
      'Interactive graph of your resources. See prerequisites, builds-on, and alternative paths at a glance.',
    iconPath: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    accentColor: '#34d399',
    badge: 'v0.9',
  },
  {
    key: 'pomodoro',
    label: 'Pomodoro',
    description:
      'Built-in focus timer, integrated with session tracking. Configurable session and break durations.',
    iconPath: 'M12 6v6l4 2M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z',
    accentColor: '#f87171',
    badge: 'v0.10',
  },
  {
    key: 'session-tracking',
    label: 'Session Tracking',
    description: 'Log focus sessions, track daily streaks, and understand your study patterns over time.',
    iconPath: 'M22 12h-4l-3 9L9 3l-3 9H2',
    accentColor: '#fb923c',
    badge: 'v0.10',
  },
  {
    key: 'spaced-repetition',
    label: 'Spaced Repetition',
    description:
      'Smart review intervals based on recall. Resources resurface at the right moment for long-term retention.',
    iconPath: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
    accentColor: '#34d399',
    badge: 'v0.11',
  },
  {
    key: 'voice-capture',
    label: 'Voice Capture',
    description:
      'Add resources hands-free using your device microphone. Rule-based field mapping from spoken input.',
    iconPath:
      'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
    accentColor: '#f472b6',
    badge: 'live',
    alwaysOn: true,
  },
  {
    key: 'file-import',
    label: 'File Import',
    description:
      'Drag-and-drop CSV/JSON import with preview table and batch processing. Validate before committing.',
    iconPath:
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3-3 3 3',
    accentColor: '#4ade80',
    badge: 'live',
    alwaysOn: true,
  },
  {
    key: 'browser-extension',
    label: 'Browser Extension Sync',
    description:
      'Capture resources directly from your browser without leaving the page. One-click add with auto-metadata.',
    iconPath:
      'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    accentColor: '#94a3b8',
    badge: 'planned',
  },
];
