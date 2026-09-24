import { MAX_PLANNED_DURATION_MIN } from '@features/pomodoro/domain/pomodoro.model';

export const POMODORO_VIEW_MODE = {
  FULL: 'full',
  MINI: 'mini',
  ZEN: 'zen',
} as const;

export type PomodoroViewMode = (typeof POMODORO_VIEW_MODE)[keyof typeof POMODORO_VIEW_MODE];

const DEFAULT_VIEW_MODE_STORAGE_KEY = 'pomodoro_default_view_mode';
const HIDE_SHORTCUT_HINTS_STORAGE_KEY = 'pomodoro_hide_shortcut_hints';
const DEFAULT_DURATION_MIN_STORAGE_KEY = 'pomodoro_default_duration_min';
const FALLBACK_DEFAULT_DURATION_MIN = 25;

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

export function readDefaultDurationMin(): number {
  try {
    const raw = localStorage.getItem(DEFAULT_DURATION_MIN_STORAGE_KEY);
    const minutes = raw !== null ? Number(raw) : Number.NaN;
    const valid = Number.isFinite(minutes) && minutes > 0 && minutes <= MAX_PLANNED_DURATION_MIN;
    return valid ? minutes : FALLBACK_DEFAULT_DURATION_MIN;
  } catch {
    return FALLBACK_DEFAULT_DURATION_MIN;
  }
}

export function writeDefaultDurationMin(minutes: number): void {
  try {
    localStorage.setItem(DEFAULT_DURATION_MIN_STORAGE_KEY, String(minutes));
  } catch {
    /* per-viewer convenience only */
  }
}
