import { DEFAULT_ENABLED_MODULES, type IUserRepository, type ModuleKey } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface ResetPreferencesDependencies {
  userRepository: IUserRepository;
}

export interface ResetPreferencesRequest {
  userId: string;
}

export interface ResetPreferencesResponse {
  enabledModules: ModuleKey[];
  widgetConfig: [];
}

export const resetPreferences = async (
  { userRepository }: ResetPreferencesDependencies,
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

  return { enabledModules: updated.enabledModules, widgetConfig: [] };
};
