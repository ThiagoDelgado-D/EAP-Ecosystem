import type { Break, HistorySnapshot, Segment, Session } from '@features/pomodoro/domain/pomodoro.model';
import { DELTA_METRIC, type DeltaMetric, type MetricDelta, type WeeklyDelta, type WeeklySummary, type WeekTotals } from './weekly-summary.model';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PRIOR_WEEKS = 4;
const RELATIVE_OBSERVATION_THRESHOLD = 0.1;
const ACTIVE_DAYS_OBSERVATION_THRESHOLD = 1;
const MAX_OBSERVATIONS = 2;

export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndexFromMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - dayIndexFromMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function summaryWindowSince(now: Date): Date {
  const since = new Date(startOfWeek(now));
  since.setDate(since.getDate() - PRIOR_WEEKS * 7);
  return since;
}

function weekIndex(date: Date, thisWeekStart: Date): number {
  return Math.round((thisWeekStart.getTime() - startOfWeek(date).getTime()) / WEEK_MS);
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function bucketByWeek<T>(items: T[], thisWeekStart: Date, startedAt: (item: T) => Date): T[][] {
  const buckets: T[][] = [[], [], [], [], []];
  for (const item of items) {
    const index = weekIndex(startedAt(item), thisWeekStart);
    if (index >= 0 && index <= PRIOR_WEEKS) buckets[index]!.push(item);
  }
  return buckets;
}

function segmentDurationSec(segment: Segment): number {
  return Math.max(0, (segment.endSec ?? segment.startSec) - segment.startSec);
}

function weekTotals(sessions: Session[], segments: Segment[], breaks: Break[], now: Date): WeekTotals {
  const sessionIds = new Set(sessions.map((session) => session.id));
  const weekSegments = segments.filter((segment) => sessionIds.has(segment.sessionId));

  const totalSec = weekSegments.reduce((sum, segment) => sum + segmentDurationSec(segment), 0);
  const unattributedSec = weekSegments
    .filter((segment) => segment.targetKind === 'free')
    .reduce((sum, segment) => sum + segmentDurationSec(segment), 0);
  const activeDays = new Set(sessions.map((session) => localDateKey(session.startedAt))).size;
  const sessionCount = sessions.length;
  const avgSessionSec = sessionCount === 0 ? 0 : totalSec / sessionCount;

  const breakTotalSec = breaks.reduce(
    (sum, activeBreak) =>
      sum + Math.max(0, ((activeBreak.endedAt ?? now).getTime() - activeBreak.startedAt.getTime()) / 1000),
    0,
  );

  return {
    focus: { totalSec, sessionCount, avgSessionSec, activeDays, unattributedSec },
    break: { totalSec: breakTotalSec, breakCount: breaks.length },
  };
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function metricDelta(current: number, baseline: number): MetricDelta {
  return {
    current,
    baseline,
    absoluteChange: current - baseline,
    relativeChange: baseline > 0 ? (current - baseline) / baseline : null,
  };
}

interface ObservationCandidate {
  metric: DeltaMetric;
  delta: MetricDelta;
  usesAbsoluteThreshold: boolean;
}

function isEligible(candidate: ObservationCandidate): boolean {
  if (candidate.usesAbsoluteThreshold) {
    return Math.abs(candidate.delta.absoluteChange) >= ACTIVE_DAYS_OBSERVATION_THRESHOLD;
  }
  return candidate.delta.relativeChange !== null && Math.abs(candidate.delta.relativeChange) >= RELATIVE_OBSERVATION_THRESHOLD;
}

function magnitude(candidate: ObservationCandidate): number {
  return candidate.usesAbsoluteThreshold
    ? Math.abs(candidate.delta.absoluteChange) / 7
    : Math.abs(candidate.delta.relativeChange ?? 0);
}

function weeksLabel(weeksAveraged: number): string {
  return weeksAveraged === 1 ? 'last week' : `last ${weeksAveraged}-week average`;
}

function observationSentence(candidate: ObservationCandidate, weeksAveraged: number): string {
  const label = weeksLabel(weeksAveraged);
  const pct = Math.round(Math.abs(candidate.delta.relativeChange ?? 0) * 100);

  switch (candidate.metric) {
    case DELTA_METRIC.FOCUS_TOTAL_SEC:
      return `Your total focus time was ${pct}% ${candidate.delta.absoluteChange > 0 ? 'higher' : 'lower'} than your ${label}.`;
    case DELTA_METRIC.AVG_SESSION_SEC:
      return `Your average focus session was ${pct}% ${candidate.delta.absoluteChange > 0 ? 'longer' : 'shorter'} than your ${label}.`;
    case DELTA_METRIC.BREAK_TOTAL_SEC:
      return `Your break time was ${pct}% ${candidate.delta.absoluteChange > 0 ? 'higher' : 'lower'} than your ${label}.`;
    case DELTA_METRIC.ACTIVE_DAYS: {
      const days = Math.round(Math.abs(candidate.delta.absoluteChange));
      return `You had ${days} ${candidate.delta.absoluteChange > 0 ? 'more' : 'fewer'} active day${days === 1 ? '' : 's'} than usual this week.`;
    }
  }
}

export function computeWeeklySummary(history: HistorySnapshot, now: Date = new Date()): WeeklySummary {
  const thisWeekStart = startOfWeek(now);
  const sessionsByWeek = bucketByWeek(history.sessions, thisWeekStart, (session) => session.startedAt);
  const breaksByWeek = bucketByWeek(history.breaks, thisWeekStart, (activeBreak) => activeBreak.startedAt);

  const weeks = sessionsByWeek.map((sessions, index) =>
    weekTotals(sessions, history.segments, breaksByWeek[index]!, now),
  );

  const thisWeek = weeks[0]!;
  const priorWeeks = weeks.slice(1);
  const weeksWithSessions = priorWeeks.filter((week) => week.focus.sessionCount > 0);

  if (weeksWithSessions.length === 0) {
    return { thisWeek, delta: null, observations: [] };
  }

  const weeksAveraged = weeksWithSessions.length;
  const delta: WeeklyDelta = {
    weeksAveraged,
    focusTotalSec: metricDelta(
      thisWeek.focus.totalSec,
      average(weeksWithSessions.map((week) => week.focus.totalSec)),
    ),
    avgSessionSec: metricDelta(
      thisWeek.focus.avgSessionSec,
      average(weeksWithSessions.map((week) => week.focus.avgSessionSec)),
    ),
    activeDays: metricDelta(
      thisWeek.focus.activeDays,
      average(weeksWithSessions.map((week) => week.focus.activeDays)),
    ),
    breakTotalSec: metricDelta(
      thisWeek.break.totalSec,
      average(weeksWithSessions.map((week) => week.break.totalSec)),
    ),
  };

  const candidates: ObservationCandidate[] = [
    { metric: DELTA_METRIC.FOCUS_TOTAL_SEC, delta: delta.focusTotalSec, usesAbsoluteThreshold: false },
    { metric: DELTA_METRIC.AVG_SESSION_SEC, delta: delta.avgSessionSec, usesAbsoluteThreshold: false },
    { metric: DELTA_METRIC.BREAK_TOTAL_SEC, delta: delta.breakTotalSec, usesAbsoluteThreshold: false },
    { metric: DELTA_METRIC.ACTIVE_DAYS, delta: delta.activeDays, usesAbsoluteThreshold: true },
  ];

  const observations = candidates
    .filter(isEligible)
    .sort((a, b) => magnitude(b) - magnitude(a))
    .slice(0, MAX_OBSERVATIONS)
    .map((candidate) => observationSentence(candidate, weeksAveraged));

  return { thisWeek, delta, observations };
}
