import type { Session } from "../entities/session.js";

export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findByRefreshTokenHash(hash: string): Promise<Session | null>;
  findById(id: string): Promise<Session | null>;
  revoke(id: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  findActiveByUserId(userId: string): Promise<Session[]>;
}
