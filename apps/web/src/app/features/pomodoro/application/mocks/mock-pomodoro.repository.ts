import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import type {
  EndSessionResult,
  Segment,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SuggestedCandidate,
  SwitchTargetResult,
} from '@features/pomodoro/domain/pomodoro.model';

export interface MockedPomodoroRepository extends PomodoroRepository {
  sessions: Session[];
  suggestions: SuggestedCandidate[];
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
  initial: { sessions?: Session[]; suggestions?: SuggestedCandidate[] } = {},
): MockedPomodoroRepository {
  return {
    sessions: [...(initial.sessions ?? [])],
    suggestions: [...(initial.suggestions ?? [])],

    async startSession(payload: StartSessionPayload): Promise<Session> {
      const session: Session = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        startedAt: new Date(),
        intent: payload.intent,
        plannedMin: payload.plannedMin,
      };
      this.sessions.push(session);
      return session;
    },

    async switchTarget(sessionId: string, target: SegmentTarget): Promise<SwitchTargetResult> {
      const now = Math.floor(Date.now() / 1000);
      const closedSegment: Segment = {
        id: crypto.randomUUID(),
        sessionId,
        startSec: 0,
        endSec: now,
        targetKind: 'free',
      };
      const openedSegment = buildOpenedSegment(sessionId, now, target);
      return { closedSegment, openedSegment };
    },

    async endSession(sessionId: string): Promise<EndSessionResult> {
      const session = this.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session not found: ${sessionId}`);
      const completed = { ...session, completedAt: new Date() };
      const index = this.sessions.findIndex((s) => s.id === sessionId);
      this.sessions[index] = completed;
      return { discarded: false, session: completed, segments: [] };
    },

    async startBreak(): Promise<void> {},

    async getSuggestion(): Promise<SuggestedCandidate[]> {
      return this.suggestions;
    },

    reset(): void {
      this.sessions = [];
      this.suggestions = [];
    },
  };
}
