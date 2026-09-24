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
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";
import { verifyLearningPathOwnership } from "./verify-learning-path-ownership.js";

export interface DeleteLearningPathNodeDependencies {
  learningPathRepository: ILearningPathRepository;
  currentUser: CurrentUser;
}

export interface DeleteLearningPathNodeRequest {
  pathId: UUID;
  nodeId: UUID;
}

const deleteLearningPathNodeSchema = createValidationSchema<DeleteLearningPathNodeRequest>({
  pathId: uuidField("PathId", { required: true }),
  nodeId: uuidField("NodeId", { required: true }),
});

export const deleteLearningPathNode = async (
  { learningPathRepository, currentUser }: DeleteLearningPathNodeDependencies,
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

  const { pathId, nodeId } = validationResult;

  const path = await verifyLearningPathOwnership(learningPathRepository, pathId, currentUser);
  if (isErrorResult(path)) return path;

  const node = await learningPathRepository.findNodeById(nodeId);
  if (!node || node.pathId !== pathId) return new LearningPathNodeNotFoundError();

  await learningPathRepository.deleteNode(nodeId);
};
