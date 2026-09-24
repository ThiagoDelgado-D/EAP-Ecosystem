import {
  createValidationSchema,
  type CryptoService,
  type CurrentUser,
  InvalidDataError,
  isErrorResult,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  type ILearningPathRepository,
  type LearningPathEdge,
} from "@learning-resource/domain";
import {
  DuplicateLearningPathEdgeError,
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";
import { verifyLearningPathOwnership } from "./verify-learning-path-ownership.js";

export interface AddLearningPathEdgeDependencies {
  learningPathRepository: ILearningPathRepository;
  cryptoService: CryptoService;
  currentUser: CurrentUser;
}

export interface AddLearningPathEdgeRequest {
  pathId: UUID;
  sourceNodeId: UUID;
  targetNodeId: UUID;
}

const addLearningPathEdgeSchema = createValidationSchema<AddLearningPathEdgeRequest>({
  pathId: uuidField("PathId", { required: true }),
  sourceNodeId: uuidField("SourceNodeId", { required: true }),
  targetNodeId: uuidField("TargetNodeId", { required: true }),
});

export const addLearningPathEdge = async (
  { learningPathRepository, cryptoService, currentUser }: AddLearningPathEdgeDependencies,
  request: AddLearningPathEdgeRequest,
): Promise<
  | LearningPathEdge
  | LearningPathNotFoundError
  | LearningPathForbiddenError
  | LearningPathNodeNotFoundError
  | DuplicateLearningPathEdgeError
  | InvalidDataError
> => {
  const validationResult = addLearningPathEdgeSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { pathId, sourceNodeId, targetNodeId } = validationResult;

  if (sourceNodeId === targetNodeId) {
    return new InvalidDataError({ sourceNodeId: "Source and target node must be different" });
  }

  const path = await verifyLearningPathOwnership(learningPathRepository, pathId, currentUser);
  if (isErrorResult(path)) return path;

  const sourceNode = await learningPathRepository.findNodeById(sourceNodeId);
  if (sourceNode?.pathId !== pathId) return new LearningPathNodeNotFoundError();

  const targetNode = await learningPathRepository.findNodeById(targetNodeId);
  if (targetNode?.pathId !== pathId) return new LearningPathNodeNotFoundError();

  const existingEdges = await learningPathRepository.findEdgesByPathId(pathId);
  const isDuplicate = existingEdges.some(
    (e) => e.sourceNodeId === sourceNodeId && e.targetNodeId === targetNodeId,
  );
  if (isDuplicate) return new DuplicateLearningPathEdgeError();

  const edge: LearningPathEdge = {
    id: await cryptoService.generateUUID(),
    pathId,
    sourceNodeId,
    targetNodeId,
  };

  return learningPathRepository.saveEdge(edge);
};
