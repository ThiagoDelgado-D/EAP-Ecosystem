import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SessionService } from '@features/settings/application/session.service';
import type { Session } from '@features/settings/domain/settings.model';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './sessions.component.html',
})
export class SessionsComponent implements OnInit {
  private readonly sessionService = inject(SessionService);

  readonly sessions = this.sessionService.sessions;
  readonly loading = this.sessionService.loading;
  readonly error = this.sessionService.error;

  async ngOnInit(): Promise<void> {
    await this.sessionService.loadSessions();
  }

  async revoke(session: Session): Promise<void> {
    await this.sessionService.revokeSession(session.id);
  }

  async revokeAllOthers(): Promise<void> {
    await this.sessionService.revokeAllOtherSessions();
  }

  getBrowser(userAgent: string | null): string {
    if (!userAgent) return 'Unknown device';
    if (/Edg\//.test(userAgent)) return 'Microsoft Edge';
    if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) return 'Google Chrome';
    if (/Firefox\//.test(userAgent)) return 'Firefox';
    if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    if (/OPR\/|Opera\//.test(userAgent)) return 'Opera';
    return 'Unknown browser';
  }

  getOS(userAgent: string | null): string {
    if (!userAgent) return '';
    if (/Windows NT/.test(userAgent)) return 'Windows';
    if (/Mac OS X/.test(userAgent)) return 'macOS';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iPhone|iPad/.test(userAgent)) return 'iOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    return '';
  }

  hasOtherSessions(): boolean {
    return this.sessions().some((s) => !s.isCurrent);
  }
}
