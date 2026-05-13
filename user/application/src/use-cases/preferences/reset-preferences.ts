import type { IUserRepository } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface ResetPreferencesDependencies {
  userRepository: IUserRepository;
}

export interface ResetPreferencesRequest {
  userId: string;
}

export interface ResetPreferencesResponse {
  featureConfig: [];
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
    featureConfig: [],
    widgetConfig: [],
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return { featureConfig: [], widgetConfig: [] };
};
