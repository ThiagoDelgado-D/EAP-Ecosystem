import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { SessionRepository } from '@features/settings/domain/session.repository';
import type { Session } from '@features/settings/domain/settings.model';
import type { SessionDto } from './settings.dto';

@Injectable()
export class SessionHttpRepository extends SessionRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/auth`;

  async getSessions(): Promise<Session[]> {
    const dtos = await firstValueFrom(this.http.get<SessionDto[]>(`${this.base}/sessions`));
    return dtos.map((dto) => this.toDomain(dto));
  }

  async revokeSession(sessionId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.base}/sessions/${sessionId}`));
  }

  async revokeAllOtherSessions(): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.base}/sessions`));
  }

  private toDomain(dto: SessionDto): Session {
    return {
      id: dto.id,
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
      createdAt: dto.createdAt,
      expiresAt: dto.expiresAt,
      isCurrent: dto.isCurrent,
    };
  }
}
