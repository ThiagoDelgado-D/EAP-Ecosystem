import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { AuthUser, OptionalModuleKey } from '@features/auth/domain/auth.model';

@Injectable({ providedIn: 'root' })
export class OnboardingHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/auth`;

  async completeOnboarding(
    firstName: string,
    enabledModules: OptionalModuleKey[],
  ): Promise<AuthUser> {
    const dto = await firstValueFrom(
      this.http.patch<{
        id: string;
        email: string;
        firstName: string;
        onboardingCompleted: boolean;
        enabledModules: OptionalModuleKey[];
      }>(`${this.base}/onboarding`, { firstName, enabledModules }),
    );
    return {
      id: dto.id,
      firstName: dto.firstName,
      lastName: '',
      email: dto.email,
      onboardingCompleted: dto.onboardingCompleted,
      enabledModules: dto.enabledModules,
    };
  }
}
