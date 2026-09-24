import type { CurrentUser, UUID } from "domain-lib";
import { type ILearningPathRepository, type LearningPath } from "@learning-resource/domain";
import { LearningPathForbiddenError, LearningPathNotFoundError } from "../../errors/learning-path-errors.js";

export const verifyLearningPathOwnership = async (
  learningPathRepository: ILearningPathRepository,
  pathId: UUID,
  currentUser: CurrentUser,
): Promise<LearningPath | LearningPathNotFoundError | LearningPathForbiddenError> => {
  const path = await learningPathRepository.findById(pathId);
  if (!path) return new LearningPathNotFoundError();
  if (path.userId !== currentUser.id) return new LearningPathForbiddenError();
  return path;
};
