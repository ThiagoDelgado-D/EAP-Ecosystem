import {
  createValidationSchema,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { type ILearningPathRepository } from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

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

  const existing = await learningPathRepository.findById(pathId);
  if (!existing) return new LearningPathNotFoundError();
  if (existing.userId !== userId) return new LearningPathForbiddenError();

  await learningPathRepository.delete(pathId);
};
