import type { OptionalModuleKey } from '@features/auth/domain/auth.model.js';

export interface AuthUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
  enabledModules: OptionalModuleKey[];
}

export interface VerifySignInResponseDto {
  user: AuthUserDto;
  accessToken: string;
}
