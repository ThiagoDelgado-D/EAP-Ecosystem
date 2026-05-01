import { FeatureKey } from '@features/auth/domain/auth.model.js';

export interface AuthUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
  featureConfig: FeatureKey[];
}

export interface VerifySignInResponseDto {
  user: AuthUserDto;
  accessToken: string;
}
