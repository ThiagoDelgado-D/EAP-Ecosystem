import {
  createValidationSchema,
  InvalidDataError,
  isErrorResult,
  numberField,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { type ILearningPathRepository, type LearningPathNode } from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";
import { verifyLearningPathOwnership } from "./verify-learning-path-ownership.js";

export interface UpdateLearningPathNodePositionDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface UpdateLearningPathNodePositionRequest {
  userId: UUID;
  pathId: UUID;
  nodeId: UUID;
  x: number;
  y: number;
}

const updateLearningPathNodePositionSchema =
  createValidationSchema<UpdateLearningPathNodePositionRequest>({
    userId: uuidField("UserId", { required: true }),
    pathId: uuidField("PathId", { required: true }),
    nodeId: uuidField("NodeId", { required: true }),
    x: numberField("X", { required: true }),
    y: numberField("Y", { required: true }),
  });

export const updateLearningPathNodePosition = async (
  { learningPathRepository }: UpdateLearningPathNodePositionDependencies,
  request: UpdateLearningPathNodePositionRequest,
): Promise<
  | LearningPathNode
  | LearningPathNotFoundError
  | LearningPathForbiddenError
  | LearningPathNodeNotFoundError
  | InvalidDataError
> => {
  const validationResult = await updateLearningPathNodePositionSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId, nodeId, x, y } = validationResult;

  const path = await verifyLearningPathOwnership(learningPathRepository, pathId, userId);
  if (isErrorResult(path)) return path;

  const node = await learningPathRepository.findNodeById(nodeId);
  if (!node || node.pathId !== pathId) return new LearningPathNodeNotFoundError();

  return learningPathRepository.updateNode(nodeId, { x, y });
};
