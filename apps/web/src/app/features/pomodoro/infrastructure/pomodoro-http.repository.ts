import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PomodoroRepository } from '../domain/pomodoro.repository';
import type {
  EndSessionResult,
  Segment,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SwitchTargetResult,
} from '../domain/pomodoro.model';
import type { EndSessionResponseDto, SegmentDto, SessionDto, SwitchTargetResponseDto } from './pomodoro.dto';
import { API_CONFIG } from '@core/config/api.config';

@Injectable()
export class PomodoroHttpRepository extends PomodoroRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/pomodoro`;

  async startSession(payload: StartSessionPayload): Promise<Session> {
    const dto = await firstValueFrom(
      this.http.post<SessionDto>(`${this.baseUrl}/sessions`, payload),
    );
    return this.toSessionDomain(dto);
  }

  async switchTarget(sessionId: string, target: SegmentTarget): Promise<SwitchTargetResult> {
    const dto = await firstValueFrom(
      this.http.patch<SwitchTargetResponseDto>(`${this.baseUrl}/sessions/${sessionId}/target`, {
        target,
      }),
    );
    return {
      closedSegment: this.toSegmentDomain(dto.closedSegment),
      openedSegment: this.toSegmentDomain(dto.openedSegment),
    };
  }

  async endSession(sessionId: string): Promise<EndSessionResult> {
    const dto = await firstValueFrom(
      this.http.post<EndSessionResponseDto>(`${this.baseUrl}/sessions/${sessionId}/end`, {}),
    );
    if (dto.discarded) return { discarded: true };
    return {
      discarded: false,
      session: this.toSessionDomain(dto.session),
      segments: dto.segments.map((segment) => this.toSegmentDomain(segment)),
    };
  }

  async startBreak(): Promise<void> {
    await firstValueFrom(this.http.post(`${this.baseUrl}/breaks`, {}));
  }

  private parseDate(value: string | null | undefined): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid date string: ${value}`);
    return date;
  }

  private toSessionDomain(dto: SessionDto): Session {
    return {
      id: dto.id,
      userId: dto.userId,
      startedAt: this.parseDate(dto.startedAt) ?? new Date(),
      completedAt: this.parseDate(dto.completedAt),
      intent: dto.intent,
      plannedMin: dto.plannedMin,
    };
  }

  private toSegmentDomain(dto: SegmentDto): Segment {
    const base = {
      id: dto.id,
      sessionId: dto.sessionId,
      startSec: dto.startSec,
      endSec: dto.endSec,
    };

    if (dto.targetKind === 'resource') {
      return { ...base, targetKind: 'resource', resourceId: dto.resourceId };
    }
    if (dto.targetKind === 'node') {
      return {
        ...base,
        targetKind: 'node',
        learningPathId: dto.learningPathId,
        learningPathNodeId: dto.learningPathNodeId,
        resourceId: dto.resourceId,
      };
    }
    return { ...base, targetKind: 'free' };
  }
}
