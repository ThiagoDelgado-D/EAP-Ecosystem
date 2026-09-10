import type { UUID } from "domain-lib";
import type { Session } from "../entities/session.js";
import type { Segment } from "../entities/segment.js";

export interface ISessionRepository {
  save(session: Session): Promise<Session>;
  update(session: Session): Promise<Session>;
  delete(sessionId: UUID): Promise<void>;
  findById(sessionId: UUID): Promise<Session | null>;

  findActiveByUserId(userId: UUID): Promise<Session | null>;
  findMostRecentByUserId(userId: UUID): Promise<Session | null>;

  saveSegment(segment: Segment): Promise<Segment>;
  updateSegment(segment: Segment): Promise<Segment>;
  findOpenSegmentBySessionId(sessionId: UUID): Promise<Segment | null>;
  findSegmentsBySessionId(sessionId: UUID): Promise<Segment[]>;
  findSegmentsByUserIdSince(userId: UUID, since: Date): Promise<Segment[]>;
}
