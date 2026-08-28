import {
  createValidationSchema,
  InvalidDataError,
  isErrorResult,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { type ILearningPathRepository } from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";
import { verifyLearningPathOwnership } from "./verify-learning-path-ownership.js";

export interface DeleteLearningPathDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface DeleteLearningPathRequest {
  userId: UUID;
  pathId: UUID;
}

const deleteLearningPathSchema =
  createValidationSchema<DeleteLearningPathRequest>({
    userId: uuidField("UserId", { required: true }),
    pathId: uuidField("PathId", { required: true }),
  });

export const deleteLearningPath = async (
  { learningPathRepository }: DeleteLearningPathDependencies,
  request: DeleteLearningPathRequest,
): Promise<
  | void
  | InvalidDataError
  | LearningPathNotFoundError
  | LearningPathForbiddenError
> => {
  const validationResult = await deleteLearningPathSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId } = validationResult;

  const existing = await verifyLearningPathOwnership(learningPathRepository, pathId, userId);
  if (isErrorResult(existing)) return existing;

  await learningPathRepository.delete(pathId);
};
