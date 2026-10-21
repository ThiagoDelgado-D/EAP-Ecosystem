import type {
  Capabilities,
  EntitlementsProvider,
  IUserRepository,
  ModuleKey,
} from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { resolveLearnerCapabilities } from "../../utils/resolve-learner-capabilities.js";

export interface UpdateEnabledModulesDependencies {
  userRepository: IUserRepository;
  entitlementsProvider: EntitlementsProvider;
}

export interface UpdateEnabledModulesRequest {
  userId: string;
  enabledModules: ModuleKey[];
}

export interface UpdateEnabledModulesResponse {
  enabledModules: ModuleKey[];
  capabilities: Capabilities;
}

export const updateEnabledModules = async (
  { userRepository, entitlementsProvider }: UpdateEnabledModulesDependencies,
  request: UpdateEnabledModulesRequest,
): Promise<UpdateEnabledModulesResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    enabledModules: request.enabledModules,
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return {
    enabledModules: updated.enabledModules,
    capabilities: await resolveLearnerCapabilities(entitlementsProvider, updated),
  };
};
