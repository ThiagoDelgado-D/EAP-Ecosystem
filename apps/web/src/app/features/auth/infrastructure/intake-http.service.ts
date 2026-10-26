import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import type { ComposedSetup, IntakeAnswers } from '@features/auth/domain/intake.model';

@Injectable({ providedIn: 'root' })
export class IntakeHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/preferences/intake`;

  async previewSetup(answers: IntakeAnswers): Promise<ComposedSetup> {
    const dto = await firstValueFrom(
      this.http.post<ComposedSetup>(`${this.base}/preview`, {
        goals: answers.goals,
        studyStyle: answers.studyStyle,
      }),
    );
    return {
      enabledModules: dto.enabledModules,
      weeklyGoalMinutes: dto.weeklyGoalMinutes,
      reasons: dto.reasons,
    };
  }
}
