import type { CurrentUser, UUID } from "domain-lib";
import { type ILearningResourceRepository, type LearningResource } from "@learning-resource/domain";
import { LearningResourceForbiddenError, LearningResourceNotFoundError } from "../../errors/index.js";

export const verifyLearningResourceOwnership = async (
  learningResourceRepository: ILearningResourceRepository,
  resourceId: UUID,
  currentUser: CurrentUser,
): Promise<LearningResource | LearningResourceNotFoundError | LearningResourceForbiddenError> => {
  const resource = await learningResourceRepository.findById(resourceId);
  if (!resource) return new LearningResourceNotFoundError();
  if (resource.userId !== currentUser.id) return new LearningResourceForbiddenError();
  return resource;
};
