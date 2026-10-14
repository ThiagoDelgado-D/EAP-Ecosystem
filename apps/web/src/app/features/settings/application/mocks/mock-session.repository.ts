import { SessionRepository } from '@features/settings/domain/session.repository';
import type { Session } from '@features/settings/domain/settings.model';

export function sessionFixture(isCurrent: boolean): Session {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0',
    ipAddress: '203.0.113.7',
    createdAt: now,
    expiresAt: now,
    isCurrent,
  };
}

export interface MockedSessionRepository extends SessionRepository {
  sessions: Session[];
}

export function mockSessionRepository(sessions: Session[] = []): MockedSessionRepository {
  return {
    sessions,

    getSessions(): Promise<Session[]> {
      return Promise.resolve(this.sessions);
    },

    revokeSession(sessionId: string): Promise<void> {
      this.sessions = this.sessions.filter((session) => session.id !== sessionId);
      return Promise.resolve();
    },

    revokeAllOtherSessions(): Promise<void> {
      this.sessions = this.sessions.filter((session) => session.isCurrent);
      return Promise.resolve();
    },
  };
}
