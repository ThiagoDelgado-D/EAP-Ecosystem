import {
  createValidationSchema,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { type ILearningPathRepository } from "@learning-resource/domain";
import {
  LearningPathEdgeNotFoundError,
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

export interface DeleteLearningPathEdgeDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface DeleteLearningPathEdgeRequest {
  userId: UUID;
  pathId: UUID;
  edgeId: UUID;
}

const deleteLearningPathEdgeSchema = createValidationSchema<DeleteLearningPathEdgeRequest>({
  userId: uuidField("UserId", { required: true }),
  pathId: uuidField("PathId", { required: true }),
  edgeId: uuidField("EdgeId", { required: true }),
});

export const deleteLearningPathEdge = async (
  { learningPathRepository }: DeleteLearningPathEdgeDependencies,
  request: DeleteLearningPathEdgeRequest,
): Promise<
  | void
  | LearningPathNotFoundError
  | LearningPathForbiddenError
  | LearningPathEdgeNotFoundError
  | InvalidDataError
> => {
  const validationResult = await deleteLearningPathEdgeSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId, edgeId } = validationResult;

  const path = await learningPathRepository.findById(pathId);
  if (!path) return new LearningPathNotFoundError();
  if (path.userId !== userId) return new LearningPathForbiddenError();

  const edges = await learningPathRepository.findEdgesByPathId(pathId);
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return new LearningPathEdgeNotFoundError();

  await learningPathRepository.deleteEdge(edgeId);
};
