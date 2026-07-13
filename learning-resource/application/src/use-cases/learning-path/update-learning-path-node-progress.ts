import {
  createValidationSchema,
  enumField,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  NodeProgress,
  type ILearningPathRepository,
  type LearningPathNode,
} from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

export interface UpdateLearningPathNodeProgressDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface UpdateLearningPathNodeProgressRequest {
  userId: UUID;
  pathId: UUID;
  nodeId: UUID;
  progress: NodeProgress;
}

const updateLearningPathNodeProgressSchema =
  createValidationSchema<UpdateLearningPathNodeProgressRequest>({
    userId: uuidField("UserId", { required: true }),
    pathId: uuidField("PathId", { required: true }),
    nodeId: uuidField("NodeId", { required: true }),
    progress: enumField(Object.values(NodeProgress) as NodeProgress[], "Progress", {
      required: true,
    }),
  });

export const updateLearningPathNodeProgress = async (
  { learningPathRepository }: UpdateLearningPathNodeProgressDependencies,
  request: UpdateLearningPathNodeProgressRequest,
): Promise<
  | LearningPathNode
  | LearningPathNotFoundError
  | LearningPathForbiddenError
  | LearningPathNodeNotFoundError
  | InvalidDataError
> => {
  const validationResult = await updateLearningPathNodeProgressSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId, nodeId, progress } = validationResult;

  const path = await learningPathRepository.findById(pathId);
  if (!path) return new LearningPathNotFoundError();
  if (path.userId !== userId) return new LearningPathForbiddenError();

  const node = await learningPathRepository.findNodeById(nodeId);
  if (!node || node.pathId !== pathId) return new LearningPathNodeNotFoundError();

  return learningPathRepository.updateNode(nodeId, { progress });
};
