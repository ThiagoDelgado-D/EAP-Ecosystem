import type { IUserRepository, UserAppearancePreferences } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface GetUserAppearanceDependencies {
  userRepository: IUserRepository;
}

export interface GetUserAppearanceRequest {
  userId: string;
}

export interface GetUserAppearanceResponse {
  appearance: UserAppearancePreferences;
}

export const getUserAppearance = async (
  { userRepository }: GetUserAppearanceDependencies,
  request: GetUserAppearanceRequest,
): Promise<GetUserAppearanceResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  return { appearance: user.appearance };
};
