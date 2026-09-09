import type { UUID } from "domain-lib";
import type { Session } from "../entities/session.js";
import type { Segment } from "../entities/segment.js";

export interface ISessionRepository {
  save(session: Session): Promise<Session>;
  findById(sessionId: UUID): Promise<Session | null>;
  findActiveByUserId(userId: UUID): Promise<Session | null>;
  saveSegment(segment: Segment): Promise<Segment>;
  updateSegment(segment: Segment): Promise<Segment>;
  findOpenSegmentBySessionId(sessionId: UUID): Promise<Segment | null>;
}
