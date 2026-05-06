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
    this.error.set(null);
    const revoked = this.sessions().find((s) => s.id === sessionId);
    this.sessions.update((list) => list.filter((s) => s.id !== sessionId));
    try {
      await this.repository.revokeSession(sessionId);
    } catch {
      if (revoked) {
        this.sessions.update((list) => [revoked, ...list]);
      }
      this.error.set('Failed to revoke session');
    }
  }

  async revokeAllOtherSessions(): Promise<void> {
    this.error.set(null);
    const removed = this.sessions().filter((s) => !s.isCurrent);
    this.sessions.update((list) => list.filter((s) => s.isCurrent));
    try {
      await this.repository.revokeAllOtherSessions();
    } catch {
      this.sessions.update((list) => [...removed, ...list]);
      this.error.set('Failed to revoke sessions');
    }
  }
}
