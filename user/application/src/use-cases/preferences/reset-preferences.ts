import {
  DEFAULT_ENABLED_MODULES,
  type Capabilities,
  type EntitlementsProvider,
  type IUserRepository,
  type ModuleKey,
} from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { resolveLearnerCapabilities } from "../../utils/resolve-learner-capabilities.js";

export interface ResetPreferencesDependencies {
  userRepository: IUserRepository;
  entitlementsProvider: EntitlementsProvider;
}

export interface ResetPreferencesRequest {
  userId: string;
}

export interface ResetPreferencesResponse {
  enabledModules: ModuleKey[];
  widgetConfig: [];
  capabilities: Capabilities;
}

export const resetPreferences = async (
  { userRepository, entitlementsProvider }: ResetPreferencesDependencies,
  request: ResetPreferencesRequest,
): Promise<ResetPreferencesResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    enabledModules: [...DEFAULT_ENABLED_MODULES],
    widgetConfig: [],
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return {
    enabledModules: updated.enabledModules,
    widgetConfig: [],
    capabilities: await resolveLearnerCapabilities(entitlementsProvider, updated),
  };
};
