import { inject, Injectable, signal } from '@angular/core';
import { SessionRepository } from '@features/settings/domain/session.repository';
import type { Session } from '@features/settings/domain/settings.model';

@Injectable()
export class SessionService {
  private readonly repository = inject(SessionRepository);

  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadSessions(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const sessions = await this.repository.getSessions();
      this.sessions.set(sessions);
    } catch {
      this.error.set('Failed to load sessions');
    } finally {
      this.loading.set(false);
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    const prev = this.sessions();
    this.sessions.update((list) => list.filter((s) => s.id !== sessionId));
    try {
      await this.repository.revokeSession(sessionId);
    } catch {
      this.sessions.set(prev);
      this.error.set('Failed to revoke session');
    }
  }

  async revokeAllOtherSessions(): Promise<void> {
    const prev = this.sessions();
    this.sessions.update((list) => list.filter((s) => s.isCurrent));
    try {
      await this.repository.revokeAllOtherSessions();
    } catch {
      this.sessions.set(prev);
      this.error.set('Failed to revoke sessions');
    }
  }
}
