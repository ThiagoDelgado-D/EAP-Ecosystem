import { API_CONFIG } from '@core/config/api.config';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import type { VerifySignInResponseDto } from '@features/auth/infrastructure/auth.dto';

export const REFRESH_URL = `${API_CONFIG.baseUrl}/auth/refresh`;

export function refreshResponseFor(firstName: string): VerifySignInResponseDto {
  const user = learner(firstName);
  return {
    accessToken: crypto.randomUUID(),
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
      enabledModules: user.enabledModules,
      capabilities: capabilitiesEnabling([]),
    },
  };
}
