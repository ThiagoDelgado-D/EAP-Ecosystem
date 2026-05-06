import type { Session } from './settings.model';

export abstract class SessionRepository {
  abstract getSessions(): Promise<Session[]>;
  abstract revokeSession(sessionId: string): Promise<void>;
  abstract revokeAllOtherSessions(): Promise<void>;
}
