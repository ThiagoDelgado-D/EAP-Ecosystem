import type {
  Capabilities,
  EntitlementsProvider,
  IUserRepository,
  ModuleKey,
} from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { resolveLearnerCapabilities } from "../../utils/resolve-learner-capabilities.js";

export interface CompleteOnboardingDependencies {
  userRepository: IUserRepository;
  entitlementsProvider: EntitlementsProvider;
}

export interface CompleteOnboardingRequestModel {
  userId: string;
  firstName: string;
  enabledModules: ModuleKey[];
}

export interface CompleteOnboardingResponseModel {
  user: {
    id: string;
    email: string;
    firstName: string;
    onboardingCompleted: boolean;
    enabledModules: ModuleKey[];
    capabilities: Capabilities;
  };
}

export const completeOnboarding = async (
  { userRepository, entitlementsProvider }: CompleteOnboardingDependencies,
  request: CompleteOnboardingRequestModel,
): Promise<CompleteOnboardingResponseModel | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    firstName: request.firstName,
    enabledModules: request.enabledModules,
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
      enabledModules: updated.enabledModules,
      capabilities: await resolveLearnerCapabilities(entitlementsProvider, updated),
    },
  };
};
