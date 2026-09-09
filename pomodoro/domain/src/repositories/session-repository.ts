import type { UUID } from "domain-lib";
import type { Session } from "../entities/session.js";
import type { Segment } from "../entities/segment.js";

export interface ISessionRepository {
  save(session: Session): Promise<Session>;
  findActiveByUserId(userId: UUID): Promise<Session | null>;
  saveSegment(segment: Segment): Promise<Segment>;
}
