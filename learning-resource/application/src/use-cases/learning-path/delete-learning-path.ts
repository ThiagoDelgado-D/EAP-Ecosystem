import {
  createValidationSchema,
  type CurrentUser,
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
  currentUser: CurrentUser;
}

export interface DeleteLearningPathRequest {
  pathId: UUID;
}

const deleteLearningPathSchema =
  createValidationSchema<DeleteLearningPathRequest>({
    pathId: uuidField("PathId", { required: true }),
  });

export const deleteLearningPath = async (
  { learningPathRepository, currentUser }: DeleteLearningPathDependencies,
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

  const { pathId } = validationResult;

  const existing = await verifyLearningPathOwnership(learningPathRepository, pathId, currentUser);
  if (isErrorResult(existing)) return existing;

  await learningPathRepository.delete(pathId);
};
