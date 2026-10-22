import type { Capabilities, OptionalModuleKey } from '@features/auth/domain/auth.model.js';

export interface AuthUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
  enabledModules: OptionalModuleKey[];
  capabilities: Capabilities;
}

export interface VerifySignInResponseDto {
  user: AuthUserDto;
  accessToken: string;
}

export interface ModulePreferencesDto {
  enabledModules: OptionalModuleKey[];
  capabilities: Capabilities;
}
