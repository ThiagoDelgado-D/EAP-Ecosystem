import type { FeatureKey, IUserRepository } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface CompleteOnboardingDependencies {
  userRepository: IUserRepository;
}

export interface CompleteOnboardingRequestModel {
  userId: string;
  firstName: string;
  featureConfig: FeatureKey[];
}

export interface CompleteOnboardingResponseModel {
  user: {
    id: string;
    email: string;
    firstName: string;
    onboardingCompleted: boolean;
    featureConfig: FeatureKey[];
  };
}

export const completeOnboarding = async (
  { userRepository }: CompleteOnboardingDependencies,
  request: CompleteOnboardingRequestModel,
): Promise<CompleteOnboardingResponseModel | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    firstName: request.firstName,
    featureConfig: request.featureConfig,
    onboardingCompleted: true,
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return {
    user: {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      onboardingCompleted: updated.onboardingCompleted,
      featureConfig: updated.featureConfig,
    },
  };
};
