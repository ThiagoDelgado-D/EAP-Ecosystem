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
