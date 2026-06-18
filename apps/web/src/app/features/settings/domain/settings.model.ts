export const LANGUAGE_CODE = { EN: 'en', ES: 'es' } as const;
export type LanguageCode = (typeof LANGUAGE_CODE)[keyof typeof LANGUAGE_CODE];

export const START_OF_WEEK = { MONDAY: 'monday', SUNDAY: 'sunday', SATURDAY: 'saturday' } as const;
export type StartOfWeek = (typeof START_OF_WEEK)[keyof typeof START_OF_WEEK];

export interface UserAppearance {
  language: LanguageCode;
  timezone: string;
  startOfWeek: StartOfWeek;
  reduceMotion: boolean;
  compactMode: boolean;
}

export const WIDGET_KEY = {
  SYSTEM_CHECK: 'system-check',
  IDEAL_MATCH: 'ideal-match',
  FOCUS_PULSE: 'focus-pulse',
  ARCHITECTS_PULSE: 'architects-pulse',
  PENDING_TASKS: 'pending-tasks',
} as const;

export type WidgetKey = (typeof WIDGET_KEY)[keyof typeof WIDGET_KEY];

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
