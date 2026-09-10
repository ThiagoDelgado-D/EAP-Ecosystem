import type { UUID } from "domain-lib";
import type { ISessionRepository, Session, Segment } from "@pomodoro/domain";

export interface MockedSessionRepository extends ISessionRepository {
  sessions: Session[];
  segments: Segment[];
  reset(): void;
}

export function mockSessionRepository(
  initial: { sessions?: Session[]; segments?: Segment[] } = {},
): MockedSessionRepository {
  return {
    sessions: [...(initial.sessions ?? [])],
    segments: [...(initial.segments ?? [])],

    async save(session: Session): Promise<Session> {
      this.sessions.push(session);
      return session;
    },

    async update(session: Session): Promise<Session> {
      const index = this.sessions.findIndex((s) => s.id === session.id);
      if (index === -1) {
        this.sessions.push(session);
      } else {
        this.sessions[index] = session;
      }
      return session;
    },

    async delete(sessionId: UUID): Promise<void> {
      this.sessions = this.sessions.filter((s) => s.id !== sessionId);
      this.segments = this.segments.filter((s) => s.sessionId !== sessionId);
    },

    async findById(sessionId: UUID): Promise<Session | null> {
      return this.sessions.find((s) => s.id === sessionId) ?? null;
    },

    async findActiveByUserId(userId: UUID): Promise<Session | null> {
      return (
        this.sessions.find((s) => s.userId === userId && !s.completedAt) ??
        null
      );
    },

    async findMostRecentByUserId(userId: UUID): Promise<Session | null> {
      const completed = this.sessions
        .filter((s) => s.userId === userId && s.completedAt)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      return completed[0] ?? null;
    },

    async saveSegment(segment: Segment): Promise<Segment> {
      this.segments.push(segment);
      return segment;
    },

    async updateSegment(segment: Segment): Promise<Segment> {
      const index = this.segments.findIndex((s) => s.id === segment.id);
      if (index === -1) {
        this.segments.push(segment);
      } else {
        this.segments[index] = segment;
      }
      return segment;
    },

    async findOpenSegmentBySessionId(
      sessionId: UUID,
    ): Promise<Segment | null> {
      return (
        this.segments.find(
          (s) => s.sessionId === sessionId && s.endSec === undefined,
        ) ?? null
      );
    },

    async findSegmentsBySessionId(sessionId: UUID): Promise<Segment[]> {
      return this.segments.filter((s) => s.sessionId === sessionId);
    },

    async findSegmentsByUserIdSince(
      userId: UUID,
      since: Date,
    ): Promise<Segment[]> {
      const sessionIds = new Set(
        this.sessions
          .filter((s) => s.userId === userId && s.startedAt >= since)
          .map((s) => s.id),
      );
      return this.segments.filter((s) => sessionIds.has(s.sessionId));
    },

    reset(): void {
      this.sessions = [];
      this.segments = [];
    },
  };
}
