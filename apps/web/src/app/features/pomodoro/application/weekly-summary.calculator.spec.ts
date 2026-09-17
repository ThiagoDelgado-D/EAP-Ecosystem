import type { Break, HistorySnapshot, Session } from '@features/pomodoro/domain/pomodoro.model';
import { buildWeekDayLog, computeWeeklySummary, startOfWeek, summaryWindowSince } from './weekly-summary.calculator';

const now = new Date('2026-09-16T18:00:00'); // a Wednesday

function daysBefore(reference: Date, days: number): Date {
  const result = new Date(reference);
  result.setDate(result.getDate() - days);
  return result;
}

function buildSession(startedAt: Date, plannedMin = 25): Session {
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    startedAt,
    completedAt: new Date(startedAt.getTime() + plannedMin * 60_000),
    plannedMin,
  };
}

function buildBreak(startedAt: Date, durationSec: number): Break {
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    startedAt,
    durationSec,
    endedAt: new Date(startedAt.getTime() + durationSec * 1000),
  };
}

function emptyHistory(): HistorySnapshot {
  return { sessions: [], segments: [], breaks: [] };
}

describe('startOfWeek', () => {
  test('should roll a mid-week date back to Monday 00:00', () => {
    expect(startOfWeek(now)).toEqual(new Date('2026-09-14T00:00:00'));
  });

  test('should treat Monday itself as its own week start', () => {
    expect(startOfWeek(new Date('2026-09-14T09:30:00'))).toEqual(new Date('2026-09-14T00:00:00'));
  });

  test('should roll a Sunday back to the preceding Monday', () => {
    expect(startOfWeek(new Date('2026-09-20T23:00:00'))).toEqual(new Date('2026-09-14T00:00:00'));
  });
});

describe('summaryWindowSince', () => {
  test('should start 4 full weeks before the current week', () => {
    expect(summaryWindowSince(now)).toEqual(new Date('2026-08-17T00:00:00'));
  });
});

describe('computeWeeklySummary', () => {
  test('should report zeroed totals and no delta when there is no history at all', () => {
    const summary = computeWeeklySummary(emptyHistory(), now);
    expect(summary.thisWeek.focus).toEqual({
      totalSec: 0,
      sessionCount: 0,
      avgSessionSec: 0,
      activeDays: 0,
      unattributedSec: 0,
    });
    expect(summary.delta).toBeNull();
    expect(summary.observations).toEqual([]);
  });

  test('should omit the delta when no prior week has any sessions', () => {
    const thisWeekSession = buildSession(daysBefore(now, 1));
    const history: HistorySnapshot = {
      sessions: [thisWeekSession],
      segments: [{ id: crypto.randomUUID(), sessionId: thisWeekSession.id, startSec: 0, endSec: 1500, targetKind: 'free' }],
      breaks: [],
    };

    const summary = computeWeeklySummary(history, now);
    expect(summary.thisWeek.focus.sessionCount).toBe(1);
    expect(summary.delta).toBeNull();
    expect(summary.observations).toEqual([]);
  });

  test('should average only the prior weeks that had sessions, and surface a focus-time observation past the 10% threshold', () => {
    const thisWeekSession = buildSession(daysBefore(now, 1));
    const priorWeekWithData = buildSession(daysBefore(now, 8));

    const history: HistorySnapshot = {
      sessions: [thisWeekSession, priorWeekWithData],
      segments: [
        { id: crypto.randomUUID(), sessionId: thisWeekSession.id, startSec: 0, endSec: 3600, targetKind: 'free' },
        { id: crypto.randomUUID(), sessionId: priorWeekWithData.id, startSec: 0, endSec: 1200, targetKind: 'free' },
      ],
      breaks: [],
    };

    const summary = computeWeeklySummary(history, now);
    expect(summary.delta?.weeksAveraged).toBe(1);
    expect(summary.delta?.focusTotalSec).toEqual({
      current: 3600,
      baseline: 1200,
      absoluteChange: 2400,
      relativeChange: 2,
    });
    expect(summary.observations).toContain('Your total focus time was 200% higher than your last week.');
  });

  test('should not surface an observation when the change stays under threshold', () => {
    const thisWeekSession = buildSession(daysBefore(now, 1));
    const priorWeekSession = buildSession(daysBefore(now, 8));

    const history: HistorySnapshot = {
      sessions: [thisWeekSession, priorWeekSession],
      segments: [
        { id: crypto.randomUUID(), sessionId: thisWeekSession.id, startSec: 0, endSec: 1500, targetKind: 'free' },
        { id: crypto.randomUUID(), sessionId: priorWeekSession.id, startSec: 0, endSec: 1450, targetKind: 'free' },
      ],
      breaks: [],
    };

    const summary = computeWeeklySummary(history, now);
    expect(summary.observations).toEqual([]);
  });

  test('should surface an active-days observation phrased against "usual", not a numeric average', () => {
    const thisWeekSessions = [0, 1, 2].map((offset) => buildSession(daysBefore(now, offset)));
    const priorWeekSession = buildSession(daysBefore(now, 8));

    const history: HistorySnapshot = {
      sessions: [...thisWeekSessions, priorWeekSession],
      segments: [],
      breaks: [],
    };

    const summary = computeWeeklySummary(history, now);
    expect(summary.delta?.activeDays.current).toBe(3);
    expect(summary.delta?.activeDays.baseline).toBe(1);
    expect(summary.observations).toContain('You had 2 more active days than usual this week.');
  });

  test('should count break time from actual elapsed duration, not the allocated durationSec', () => {
    const session = buildSession(daysBefore(now, 1));
    const shortenedBreak = buildBreak(daysBefore(now, 1), 600);
    shortenedBreak.endedAt = new Date(shortenedBreak.startedAt.getTime() + 120_000); // ended after 2 min, not the allocated 10

    const history: HistorySnapshot = { sessions: [session], segments: [], breaks: [shortenedBreak] };
    const summary = computeWeeklySummary(history, now);
    expect(summary.thisWeek.break.totalSec).toBe(120);
    expect(summary.thisWeek.break.breakCount).toBe(1);
  });

  test('should keep the top two observations when more than two clear their threshold', () => {
    const thisWeekSessions = [0, 1, 2, 3].map((offset) => buildSession(daysBefore(now, offset)));
    const priorWeekSession = buildSession(daysBefore(now, 8));

    const history: HistorySnapshot = {
      sessions: [...thisWeekSessions, priorWeekSession],
      segments: [
        ...thisWeekSessions.map((session) => ({
          id: crypto.randomUUID(),
          sessionId: session.id,
          startSec: 0,
          endSec: 3000,
          targetKind: 'free' as const,
        })),
        { id: crypto.randomUUID(), sessionId: priorWeekSession.id, startSec: 0, endSec: 300, targetKind: 'free' as const },
      ],
      breaks: [],
    };

    const summary = computeWeeklySummary(history, now);
    expect(summary.observations.length).toBe(2);
  });
});

describe('buildWeekDayLog', () => {
  test('should return the last 7 days ending today, oldest first, even with no history', () => {
    const days = buildWeekDayLog(emptyHistory(), now);

    expect(days).toHaveLength(7);
    expect(days[0]!.date).toEqual(new Date('2026-09-10T00:00:00'));
    expect(days[6]!.date).toEqual(new Date('2026-09-16T00:00:00'));
    expect(days.every((day) => day.sessionCount === 0 && day.sessions.length === 0)).toBe(true);
  });

  test('should bucket a session and its segments under the day it started', () => {
    const yesterdaySession = buildSession(daysBefore(now, 1));
    const history: HistorySnapshot = {
      sessions: [yesterdaySession],
      segments: [
        { id: crypto.randomUUID(), sessionId: yesterdaySession.id, startSec: 0, endSec: 900, targetKind: 'free' },
        { id: crypto.randomUUID(), sessionId: yesterdaySession.id, startSec: 900, endSec: 1500, targetKind: 'free' },
      ],
      breaks: [],
    };

    const days = buildWeekDayLog(history, now);
    const yesterday = days[5]!;

    expect(yesterday.sessionCount).toBe(1);
    expect(yesterday.focusSec).toBe(1500);
    expect(yesterday.sessions[0]!.segments).toHaveLength(2);
    expect(days.filter((day) => day.sessionCount > 0)).toHaveLength(1);
  });

  test('should exclude sessions and breaks from before the rolling 7-day window', () => {
    const eightDaysAgoSession = buildSession(daysBefore(now, 8));
    const eightDaysAgoBreak = buildBreak(daysBefore(now, 8), 300);
    const history: HistorySnapshot = { sessions: [eightDaysAgoSession], segments: [], breaks: [eightDaysAgoBreak] };

    const days = buildWeekDayLog(history, now);

    expect(days.every((day) => day.sessionCount === 0 && day.breakSec === 0)).toBe(true);
  });

  test('should order same-day sessions chronologically regardless of input order', () => {
    const morning = buildSession(new Date('2026-09-16T08:00:00'));
    const evening = buildSession(new Date('2026-09-16T20:00:00'));
    const history: HistorySnapshot = { sessions: [evening, morning], segments: [], breaks: [] };

    const days = buildWeekDayLog(history, now);
    const today = days[6]!;

    expect(today.sessions.map((entry) => entry.session.id)).toEqual([morning.id, evening.id]);
  });
});
