import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { isApiError } from '@core/errors/api-error';
import { AuthUser, type ModulePreferences } from '@features/auth/domain/auth.model';
import {
  ModulePreferencesDto,
  VerifySignInResponseDto,
} from '@features/auth/infrastructure/auth.dto';

export interface VerifySignInResult {
  user: AuthUser;
  accessToken: string;
}

const SESSION_REJECTED_STATUSES: readonly number[] = [400, 401];

export function isSessionRejected(refreshError: unknown): boolean {
  return isApiError(refreshError) && SESSION_REJECTED_STATUSES.includes(refreshError.status);
}

@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/auth`;
  private inFlightRefresh: Promise<VerifySignInResult> | null = null;

  async requestSignIn(email: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.base}/request-sign-in`, { email }));
  }

  async verifySignIn(email: string, code: string): Promise<VerifySignInResult> {
    const dto = await firstValueFrom(
      this.http.post<VerifySignInResponseDto>(`${this.base}/verify-sign-in`, { email, code }),
    );
    return this.mapVerifySignInResult(dto);
  }

  refresh(): Promise<VerifySignInResult> {
    this.inFlightRefresh ??= this.postRefresh().finally(() => {
      this.inFlightRefresh = null;
    });
    return this.inFlightRefresh;
  }

  private async postRefresh(): Promise<VerifySignInResult> {
    const dto = await firstValueFrom(
      this.http.post<VerifySignInResponseDto>(`${this.base}/refresh`, {}),
    );
    return this.mapVerifySignInResult(dto);
  }

  async getModulePreferences(): Promise<ModulePreferences> {
    const dto = await firstValueFrom(
      this.http.get<ModulePreferencesDto>(`${API_CONFIG.baseUrl}/preferences/modules`),
    );
    return { enabledModules: dto.enabledModules, capabilities: dto.capabilities };
  }

  async signOut(): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.base}/sign-out`, {}));
  }

  private mapVerifySignInResult(dto: VerifySignInResponseDto): VerifySignInResult {
    return {
      accessToken: dto.accessToken,
      user: {
        id: dto.user.id,
        firstName: dto.user.firstName,
        lastName: dto.user.lastName,
        email: dto.user.email,
        onboardingCompleted: dto.user.onboardingCompleted,
        enabledModules: dto.user.enabledModules ?? [],
        capabilities: dto.user.capabilities,
      },
    };
  }
}
