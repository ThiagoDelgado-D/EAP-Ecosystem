import type { Segment, Session } from '@features/pomodoro/domain/pomodoro.model';

export interface FocusTotals {
  totalSec: number;
  sessionCount: number;
  avgSessionSec: number;
  activeDays: number;
  unattributedSec: number;
}

export interface BreakTotals {
  totalSec: number;
  breakCount: number;
}

export interface WeekTotals {
  focus: FocusTotals;
  break: BreakTotals;
}

export const DELTA_METRIC = {
  FOCUS_TOTAL_SEC: 'focusTotalSec',
  AVG_SESSION_SEC: 'avgSessionSec',
  ACTIVE_DAYS: 'activeDays',
  BREAK_TOTAL_SEC: 'breakTotalSec',
} as const;

export type DeltaMetric = (typeof DELTA_METRIC)[keyof typeof DELTA_METRIC];

export interface MetricDelta {
  current: number;
  baseline: number;
  absoluteChange: number;
  relativeChange: number | null;
}

export interface WeeklyDelta {
  weeksAveraged: number;
  focusTotalSec: MetricDelta;
  avgSessionSec: MetricDelta;
  activeDays: MetricDelta;
  breakTotalSec: MetricDelta;
}

export interface WeeklySummary {
  thisWeek: WeekTotals;
  delta: WeeklyDelta | null;
  observations: string[];
}

export interface DaySession {
  session: Session;
  segments: Segment[];
  focusSec: number;
}

export interface DayLog {
  date: Date;
  focusSec: number;
  breakSec: number;
  sessionCount: number;
  sessions: DaySession[];
}
