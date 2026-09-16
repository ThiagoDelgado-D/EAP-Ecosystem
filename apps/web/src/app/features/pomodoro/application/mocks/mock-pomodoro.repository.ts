import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import {
  DEFAULT_BREAK_DURATION_SEC,
  type ActiveSessionSnapshot,
  type Break,
  type EndSessionResult,
  type HistorySnapshot,
  type Segment,
  type SegmentTarget,
  type Session,
  type StartSessionPayload,
  type SuggestedCandidate,
  type SwitchTargetResult,
} from '@features/pomodoro/domain/pomodoro.model';

export interface MockedPomodoroRepository extends PomodoroRepository {
  sessions: Session[];
  segments: Segment[];
  suggestions: SuggestedCandidate[];
  breaks: Break[];
  reset(): void;
}

function buildOpenedSegment(sessionId: string, startSec: number, target: SegmentTarget): Segment {
  if (target.kind === 'node') {
    return {
      id: crypto.randomUUID(),
      sessionId,
      startSec,
      targetKind: 'node',
      learningPathId: target.learningPathId,
      learningPathNodeId: target.learningPathNodeId,
      resourceId: target.resourceId,
    };
  }
  if (target.kind === 'resource') {
    return { id: crypto.randomUUID(), sessionId, startSec, targetKind: 'resource', resourceId: target.resourceId };
  }
  return { id: crypto.randomUUID(), sessionId, startSec, targetKind: 'free' };
}

export function mockPomodoroRepository(
  initial: {
    sessions?: Session[];
    segments?: Segment[];
    suggestions?: SuggestedCandidate[];
    breaks?: Break[];
  } = {},
): MockedPomodoroRepository {
  return {
    sessions: [...(initial.sessions ?? [])],
    segments: [...(initial.segments ?? [])],
    suggestions: [...(initial.suggestions ?? [])],
    breaks: [...(initial.breaks ?? [])],

    async startSession(payload: StartSessionPayload): Promise<Session> {
      const session: Session = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        startedAt: new Date(),
        intent: payload.intent,
        plannedMin: payload.plannedMin,
      };
      this.sessions.push(session);
      this.segments.push(buildOpenedSegment(session.id, 0, payload.target));
      return session;
    },

    async switchTarget(sessionId: string, target: SegmentTarget): Promise<SwitchTargetResult> {
      const now = Math.floor(Date.now() / 1000);
      const openIndex = this.segments.findIndex((s) => s.sessionId === sessionId && s.endSec === undefined);
      const closedSegment: Segment =
        openIndex >= 0
          ? { ...this.segments[openIndex], endSec: now }
          : { id: crypto.randomUUID(), sessionId, startSec: 0, endSec: now, targetKind: 'free' };
      if (openIndex >= 0) this.segments[openIndex] = closedSegment;
      const openedSegment = buildOpenedSegment(sessionId, now, target);
      this.segments.push(openedSegment);
      return { closedSegment, openedSegment };
    },

    async attachOpenSegment(sessionId: string, target: SegmentTarget): Promise<Segment> {
      const openIndex = this.segments.findIndex((s) => s.sessionId === sessionId && s.endSec === undefined);
      if (openIndex < 0) throw new Error(`No open segment for session: ${sessionId}`);
      const retargeted = buildOpenedSegment(sessionId, this.segments[openIndex]!.startSec, target);
      const segment: Segment = { ...retargeted, id: this.segments[openIndex]!.id };
      this.segments[openIndex] = segment;
      return segment;
    },

    async endSession(sessionId: string): Promise<EndSessionResult> {
      const session = this.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session not found: ${sessionId}`);
      const completed = { ...session, completedAt: new Date() };
      const index = this.sessions.findIndex((s) => s.id === sessionId);
      this.sessions[index] = completed;
      return { discarded: false, session: completed, segments: [] };
    },

    async startBreak(): Promise<Break> {
      const activeBreak: Break = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        startedAt: new Date(),
        durationSec: DEFAULT_BREAK_DURATION_SEC,
      };
      this.breaks.push(activeBreak);
      return activeBreak;
    },

    async getActiveBreak(): Promise<Break | null> {
      return this.breaks.find((b) => !b.endedAt) ?? null;
    },

    async extendBreak(breakId: string, seconds: number): Promise<Break> {
      const index = this.breaks.findIndex((b) => b.id === breakId);
      if (index < 0) throw new Error(`Break not found: ${breakId}`);
      const extended = { ...this.breaks[index]!, durationSec: this.breaks[index]!.durationSec + seconds };
      this.breaks[index] = extended;
      return extended;
    },

    async endBreak(breakId: string): Promise<Break> {
      const index = this.breaks.findIndex((b) => b.id === breakId);
      if (index < 0) throw new Error(`Break not found: ${breakId}`);
      const ended = { ...this.breaks[index]!, endedAt: new Date() };
      this.breaks[index] = ended;
      return ended;
    },

    async getSuggestion(): Promise<SuggestedCandidate[]> {
      return this.suggestions;
    },

    async getActiveSession(): Promise<ActiveSessionSnapshot | null> {
      const session = this.sessions.find((s) => !s.completedAt);
      if (!session) return null;
      return {
        session,
        segments: this.segments.filter((segment) => segment.sessionId === session.id),
      };
    },

    async attributeSession(sessionId: string, target: SegmentTarget): Promise<Segment[]> {
      const session = this.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session not found: ${sessionId}`);
      if (!session.completedAt) throw new Error(`Session not completed: ${sessionId}`);

      const sessionSegments = this.segments.filter((segment) => segment.sessionId === sessionId);
      if (sessionSegments.some((segment) => segment.targetKind !== 'free')) {
        throw new Error(`Segments already attributed for session: ${sessionId}`);
      }

      const attributed = sessionSegments.map((segment) => {
        const retargeted = buildOpenedSegment(sessionId, segment.startSec, target);
        return { ...retargeted, id: segment.id, endSec: segment.endSec };
      });
      this.segments = this.segments.map(
        (segment) => attributed.find((updated) => updated.id === segment.id) ?? segment,
      );
      return attributed;
    },

    async getHistory(since: Date, until?: Date): Promise<HistorySnapshot> {
      const inRange = (startedAt: Date) => startedAt >= since && (!until || startedAt < until);
      return {
        sessions: this.sessions.filter((session) => inRange(session.startedAt)),
        segments: this.segments.filter((segment) =>
          this.sessions.some(
            (session) => session.id === segment.sessionId && inRange(session.startedAt),
          ),
        ),
        breaks: this.breaks.filter((activeBreak) => inRange(activeBreak.startedAt)),
      };
    },

    reset(): void {
      this.sessions = [];
      this.segments = [];
      this.suggestions = [];
      this.breaks = [];
    },
  };
}
