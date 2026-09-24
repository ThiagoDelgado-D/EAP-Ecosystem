import {
  createValidationSchema,
  type CurrentUser,
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
  currentUser: CurrentUser;
}

export interface UpdateLearningPathNodePositionRequest {
  pathId: UUID;
  nodeId: UUID;
  x: number;
  y: number;
}

const updateLearningPathNodePositionSchema =
  createValidationSchema<UpdateLearningPathNodePositionRequest>({
    pathId: uuidField("PathId", { required: true }),
    nodeId: uuidField("NodeId", { required: true }),
    x: numberField("X", { required: true }),
    y: numberField("Y", { required: true }),
  });

export const updateLearningPathNodePosition = async (
  { learningPathRepository, currentUser }: UpdateLearningPathNodePositionDependencies,
  request: UpdateLearningPathNodePositionRequest,
): Promise<
  | LearningPathNode
  | LearningPathNotFoundError
  | LearningPathForbiddenError
  | LearningPathNodeNotFoundError
  | InvalidDataError
> => {
  const validationResult = updateLearningPathNodePositionSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { pathId, nodeId, x, y } = validationResult;

  const path = await verifyLearningPathOwnership(learningPathRepository, pathId, currentUser);
  if (isErrorResult(path)) return path;

  const node = await learningPathRepository.findNodeById(nodeId);
  if (node?.pathId !== pathId) return new LearningPathNodeNotFoundError();

  return learningPathRepository.updateNode(nodeId, { x, y });
};
