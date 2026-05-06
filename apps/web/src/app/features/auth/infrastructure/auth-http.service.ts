import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { AuthUser } from '@features/auth/domain/auth.model';
import { VerifySignInResponseDto } from '@features/auth/infrastructure/auth.dto';

export interface VerifySignInResult {
  user: AuthUser;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/auth`;

  async requestSignIn(email: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.base}/request-sign-in`, { email }));
  }

  async verifySignIn(email: string, code: string): Promise<VerifySignInResult> {
    const dto = await firstValueFrom(
      this.http.post<VerifySignInResponseDto>(`${this.base}/verify-sign-in`, { email, code }),
    );
    return {
      accessToken: dto.accessToken,
      user: {
        id: dto.user.id,
        firstName: dto.user.firstName,
        lastName: dto.user.lastName,
        email: dto.user.email,
        onboardingCompleted: dto.user.onboardingCompleted,
        featureConfig: dto.user.featureConfig ?? [],
      },
    };
  }

  async refresh(): Promise<VerifySignInResult> {
    const dto = await firstValueFrom(
      this.http.post<VerifySignInResponseDto>(`${this.base}/refresh`, {}),
    );
    return {
      accessToken: dto.accessToken,
      user: {
        id: dto.user.id,
        firstName: dto.user.firstName,
        lastName: dto.user.lastName,
        email: dto.user.email,
        onboardingCompleted: dto.user.onboardingCompleted,
        featureConfig: dto.user.featureConfig ?? [],
      },
    };
  }

  async signOut(): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.base}/sign-out`, {}));
  }
}
