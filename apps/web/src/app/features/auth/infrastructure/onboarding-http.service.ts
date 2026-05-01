import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { AuthUser, FeatureKey } from '@features/auth/domain/auth.model';

@Injectable({ providedIn: 'root' })
export class OnboardingHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/auth`;

  async completeOnboarding(firstName: string, featureConfig: FeatureKey[]): Promise<AuthUser> {
    const dto = await firstValueFrom(
      this.http.patch<{
        id: string;
        email: string;
        firstName: string;
        onboardingCompleted: boolean;
        featureConfig: FeatureKey[];
      }>(`${this.base}/onboarding`, { firstName, featureConfig }),
    );
    return {
      id: dto.id,
      firstName: dto.firstName,
      lastName: '',
      email: dto.email,
      onboardingCompleted: dto.onboardingCompleted,
      featureConfig: dto.featureConfig,
    };
  }
}
