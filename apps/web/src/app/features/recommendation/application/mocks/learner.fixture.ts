import type { AuthUser } from '@features/auth/domain/auth.model';

export function learner(firstName: string): AuthUser {
  return {
    id: crypto.randomUUID(),
    firstName,
    lastName: 'Learner',
    email: `${firstName.toLowerCase()}@example.com`,
    onboardingCompleted: true,
    featureConfig: [],
  };
}
