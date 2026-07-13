import {
  createValidationSchema,
  InvalidDataError,
  optionalEnum,
  optionalString,
  optionalNumber,
  urlField,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  NodeProgress,
  type ILearningPathRepository,
  type LearningPathNode,
  type LearningPathNodePatch,
} from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

export interface UpdateLearningPathNodeDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface UpdateLearningPathNodeRequest {
  userId: UUID;
  pathId: UUID;
  nodeId: UUID;
  title?: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: UUID | null;
  order?: number;
  progress?: NodeProgress;
}

const updateLearningPathNodeSchema = createValidationSchema<
  Omit<UpdateLearningPathNodeRequest, "learningResourceId">
>({
  userId: uuidField("UserId", { required: true }),
  pathId: uuidField("PathId", { required: true }),
  nodeId: uuidField("NodeId", { required: true }),
  title: optionalString("Title", { maxLength: 200 }),
  description: optionalString("Description", { maxLength: 1000 }),
  externalUrl: urlField("ExternalUrl", { required: false, allowEmpty: true }),
  order: optionalNumber("Order", { integer: true }),
  progress: optionalEnum(Object.values(NodeProgress) as NodeProgress[], "Progress"),
});

export const updateLearningPathNode = async (
  { learningPathRepository }: UpdateLearningPathNodeDependencies,
  request: UpdateLearningPathNodeRequest,
): Promise<
  | LearningPathNode
  | LearningPathNotFoundError
  | LearningPathForbiddenError
  | LearningPathNodeNotFoundError
  | InvalidDataError
> => {
  const validationResult = await updateLearningPathNodeSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  if (
    request.learningResourceId !== undefined &&
    request.learningResourceId !== null &&
    typeof request.learningResourceId !== "string"
  ) {
    return new InvalidDataError({ learningResourceId: "Must be a valid UUID or null" });
  }

  const { userId, pathId, nodeId, title, description, externalUrl, order, progress } = validationResult;

  const path = await learningPathRepository.findById(pathId);
  if (!path) return new LearningPathNotFoundError();
  if (path.userId !== userId) return new LearningPathForbiddenError();

  const node = await learningPathRepository.findNodeById(nodeId);
  if (!node || node.pathId !== pathId) return new LearningPathNodeNotFoundError();

  const patch: LearningPathNodePatch = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(externalUrl !== undefined && { externalUrl }),
    ...(order !== undefined && { order }),
    ...(progress !== undefined && { progress }),
    ...(request.learningResourceId !== undefined && { learningResourceId: request.learningResourceId }),
  };

  return learningPathRepository.updateNode(nodeId, patch);
};
