import type { Session } from "../entities/session.js";

export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findByRefreshTokenHash(hash: string): Promise<Session | null>;
  findById(id: string): Promise<Session | null>;
  revoke(id: string): Promise<void>;
  /**
   * Replaces a still-active session with `newSession`. Returns false, saving
   * nothing, when the old session was already revoked or rotated.
   */
  rotate(oldSessionId: string, newSession: Session): Promise<boolean>;
  revokeAllByUserId(userId: string): Promise<void>;
  revokeAllByUserIdExcept(
    userId: string,
    excludeSessionId: string,
  ): Promise<void>;
  findActiveByUserId(userId: string): Promise<Session[]>;
}
