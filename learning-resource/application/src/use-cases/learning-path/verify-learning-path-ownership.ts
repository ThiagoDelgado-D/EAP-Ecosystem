import type { UUID } from "domain-lib";
import { type ILearningPathRepository, type LearningPath } from "@learning-resource/domain";
import { LearningPathForbiddenError, LearningPathNotFoundError } from "../../errors/learning-path-errors.js";

export const verifyLearningPathOwnership = async (
  learningPathRepository: ILearningPathRepository,
  pathId: UUID,
  userId: UUID,
): Promise<LearningPath | LearningPathNotFoundError | LearningPathForbiddenError> => {
  const path = await learningPathRepository.findById(pathId);
  if (!path) return new LearningPathNotFoundError();
  if (path.userId !== userId) return new LearningPathForbiddenError();
  return path;
};
