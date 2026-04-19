import type { ISessionRepository, Session } from "@user/domain";

export interface MockedSessionRepository extends ISessionRepository {
  sessions: Session[];
  reset(): void;
  clear(): void;
  count(): number;
}

export function mockSessionRepository(
  initialSessions: Session[] = [],
): MockedSessionRepository {
  return {
    sessions: [...initialSessions],

    async save(session: Session): Promise<void> {
      const index = this.sessions.findIndex((s) => s.id === session.id);
      if (index >= 0) {
        this.sessions[index] = session;
      } else {
        this.sessions.push(session);
      }
    },

    async findByRefreshTokenHash(hash: string): Promise<Session | null> {
      return (
        this.sessions.find(
          (s) => s.refreshTokenHash === hash && !s.revokedAt,
        ) ?? null
      );
    },

    async findById(id: string): Promise<Session | null> {
      return this.sessions.find((s) => s.id === id) ?? null;
    },

    async revoke(id: string): Promise<void> {
      const index = this.sessions.findIndex((s) => s.id === id);
      if (index >= 0) {
        this.sessions[index] = { ...this.sessions[index], revokedAt: new Date() };
      }
    },

    async revokeAllByUserId(userId: string): Promise<void> {
      const now = new Date();
      this.sessions = this.sessions.map((s) =>
        s.userId === userId && !s.revokedAt ? { ...s, revokedAt: now } : s,
      );
    },

    async findActiveByUserId(userId: string): Promise<Session[]> {
      return this.sessions.filter(
        (s) => s.userId === userId && !s.revokedAt && s.expiresAt > new Date(),
      );
    },

    reset(): void {
      this.sessions = [];
    },

    clear(): void {
      this.sessions = [];
    },

    count(): number {
      return this.sessions.length;
    },
  };
}
