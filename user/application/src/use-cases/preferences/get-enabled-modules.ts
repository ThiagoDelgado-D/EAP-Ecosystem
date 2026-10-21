import type {
  Capabilities,
  EntitlementsProvider,
  IUserRepository,
  ModuleKey,
} from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { resolveLearnerCapabilities } from "../../utils/resolve-learner-capabilities.js";

export interface GetEnabledModulesDependencies {
  userRepository: IUserRepository;
  entitlementsProvider: EntitlementsProvider;
}

export interface GetEnabledModulesRequest {
  userId: string;
}

export interface GetEnabledModulesResponse {
  enabledModules: ModuleKey[];
  capabilities: Capabilities;
}

export const getEnabledModules = async (
  { userRepository, entitlementsProvider }: GetEnabledModulesDependencies,
  request: GetEnabledModulesRequest,
): Promise<GetEnabledModulesResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const enabledModules = user.enabledModules ?? [];

  return {
    enabledModules,
    capabilities: await resolveLearnerCapabilities(entitlementsProvider, {
      id: user.id,
      enabledModules,
    }),
  };
};
