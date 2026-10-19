import type { IUserRepository, ModuleKey } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface UpdateEnabledModulesDependencies {
  userRepository: IUserRepository;
}

export interface UpdateEnabledModulesRequest {
  userId: string;
  enabledModules: ModuleKey[];
}

export interface UpdateEnabledModulesResponse {
  enabledModules: ModuleKey[];
}

export const updateEnabledModules = async (
  { userRepository }: UpdateEnabledModulesDependencies,
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

  return { enabledModules: updated.enabledModules };
};
