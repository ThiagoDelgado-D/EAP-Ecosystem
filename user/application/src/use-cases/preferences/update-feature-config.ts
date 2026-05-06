import type { FeatureKey, IUserRepository } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface UpdateFeatureConfigDependencies {
  userRepository: IUserRepository;
}

export interface UpdateFeatureConfigRequest {
  userId: string;
  featureConfig: FeatureKey[];
}

export interface UpdateFeatureConfigResponse {
  featureConfig: FeatureKey[];
}

export const updateFeatureConfig = async (
  { userRepository }: UpdateFeatureConfigDependencies,
  request: UpdateFeatureConfigRequest,
): Promise<UpdateFeatureConfigResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    featureConfig: request.featureConfig,
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return { featureConfig: updated.featureConfig };
};
