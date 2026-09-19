export const POMODORO_VIEW_MODE = {
  FULL: 'full',
  MINI: 'mini',
  ZEN: 'zen',
} as const;

export type PomodoroViewMode = (typeof POMODORO_VIEW_MODE)[keyof typeof POMODORO_VIEW_MODE];

const DEFAULT_VIEW_MODE_STORAGE_KEY = 'pomodoro_default_view_mode';
const HIDE_SHORTCUT_HINTS_STORAGE_KEY = 'pomodoro_hide_shortcut_hints';

export function readDefaultViewMode(): PomodoroViewMode {
  try {
    const raw = localStorage.getItem(DEFAULT_VIEW_MODE_STORAGE_KEY);
    const known = Object.values(POMODORO_VIEW_MODE).includes(raw as PomodoroViewMode);
    return known ? (raw as PomodoroViewMode) : POMODORO_VIEW_MODE.FULL;
  } catch {
    return POMODORO_VIEW_MODE.FULL;
  }
}

export function writeDefaultViewMode(mode: PomodoroViewMode): void {
  try {
    localStorage.setItem(DEFAULT_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    /* per-viewer convenience only */
  }
}

export function readHideShortcutHints(): boolean {
  try {
    return localStorage.getItem(HIDE_SHORTCUT_HINTS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeHideShortcutHints(hidden: boolean): void {
  try {
    localStorage.setItem(HIDE_SHORTCUT_HINTS_STORAGE_KEY, String(hidden));
  } catch {
    /* per-viewer convenience only */
  }
}
