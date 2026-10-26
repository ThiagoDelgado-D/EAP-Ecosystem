import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { AuthUser, Capabilities, OptionalModuleKey } from '@features/auth/domain/auth.model';
import type { IntakeAnswers } from '@features/auth/domain/intake.model';

export interface CompleteOnboardingRequest {
  firstName: string;
  enabledModules: OptionalModuleKey[];
  intake?: IntakeAnswers;
  weeklyGoalMinutes?: number;
}

@Injectable({ providedIn: 'root' })
export class OnboardingHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/auth`;

  async completeOnboarding(request: CompleteOnboardingRequest): Promise<AuthUser> {
    const dto = await firstValueFrom(
      this.http.patch<{
        id: string;
        email: string;
        firstName: string;
        onboardingCompleted: boolean;
        enabledModules: OptionalModuleKey[];
        capabilities: Capabilities;
      }>(`${this.base}/onboarding`, {
        firstName: request.firstName,
        enabledModules: request.enabledModules,
        intake: request.intake,
        weeklyGoalMinutes: request.weeklyGoalMinutes,
      }),
    );
    return {
      id: dto.id,
      firstName: dto.firstName,
      lastName: '',
      email: dto.email,
      onboardingCompleted: dto.onboardingCompleted,
      enabledModules: dto.enabledModules,
      capabilities: dto.capabilities,
    };
  }
}
