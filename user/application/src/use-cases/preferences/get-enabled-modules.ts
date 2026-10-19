import type { IUserRepository, ModuleKey } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface GetEnabledModulesDependencies {
  userRepository: IUserRepository;
}

export interface GetEnabledModulesRequest {
  userId: string;
}

export interface GetEnabledModulesResponse {
  enabledModules: ModuleKey[];
}

export const getEnabledModules = async (
  { userRepository }: GetEnabledModulesDependencies,
  request: GetEnabledModulesRequest,
): Promise<GetEnabledModulesResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  return { enabledModules: user.enabledModules ?? [] };
};
