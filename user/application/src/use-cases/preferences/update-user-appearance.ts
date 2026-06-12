import type { IUserRepository, UserAppearancePreferences } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface UpdateUserAppearanceDependencies {
  userRepository: IUserRepository;
}

export interface UpdateUserAppearanceRequest {
  userId: string;
  appearance: Partial<UserAppearancePreferences>;
}

export interface UpdateUserAppearanceResponse {
  appearance: UserAppearancePreferences;
}

export const updateUserAppearance = async (
  { userRepository }: UpdateUserAppearanceDependencies,
  request: UpdateUserAppearanceRequest,
): Promise<UpdateUserAppearanceResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    appearance: { ...user.appearance, ...request.appearance },
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return { appearance: updated.appearance };
};
