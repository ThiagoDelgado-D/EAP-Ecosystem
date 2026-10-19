import type { FeatureKey, IUserRepository } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface GetFeatureConfigDependencies {
  userRepository: IUserRepository;
}

export interface GetFeatureConfigRequest {
  userId: string;
}

export interface GetFeatureConfigResponse {
  featureConfig: FeatureKey[];
}

export const getFeatureConfig = async (
  { userRepository }: GetFeatureConfigDependencies,
  request: GetFeatureConfigRequest,
): Promise<GetFeatureConfigResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  return { featureConfig: user.featureConfig ?? [] };
};
