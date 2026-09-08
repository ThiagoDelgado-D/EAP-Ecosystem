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

    async findActiveByUserId(userId: UUID): Promise<Session | null> {
      return (
        this.sessions.find((s) => s.userId === userId && !s.completedAt) ??
        null
      );
    },

    async saveSegment(segment: Segment): Promise<Segment> {
      this.segments.push(segment);
      return segment;
    },

    reset(): void {
      this.sessions = [];
      this.segments = [];
    },
  };
}
