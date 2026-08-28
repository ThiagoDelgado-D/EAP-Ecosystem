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
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";
import { verifyLearningPathOwnership } from "./verify-learning-path-ownership.js";

export interface DeleteLearningPathNodeDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface DeleteLearningPathNodeRequest {
  userId: UUID;
  pathId: UUID;
  nodeId: UUID;
}

const deleteLearningPathNodeSchema = createValidationSchema<DeleteLearningPathNodeRequest>({
  userId: uuidField("UserId", { required: true }),
  pathId: uuidField("PathId", { required: true }),
  nodeId: uuidField("NodeId", { required: true }),
});

export const deleteLearningPathNode = async (
  { learningPathRepository }: DeleteLearningPathNodeDependencies,
  request: DeleteLearningPathNodeRequest,
): Promise<
  | void
  | LearningPathNotFoundError
  | LearningPathForbiddenError
  | LearningPathNodeNotFoundError
  | InvalidDataError
> => {
  const validationResult = await deleteLearningPathNodeSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId, nodeId } = validationResult;

  const path = await verifyLearningPathOwnership(learningPathRepository, pathId, userId);
  if (isErrorResult(path)) return path;

  const node = await learningPathRepository.findNodeById(nodeId);
  if (!node || node.pathId !== pathId) return new LearningPathNodeNotFoundError();

  await learningPathRepository.deleteNode(nodeId);
};
