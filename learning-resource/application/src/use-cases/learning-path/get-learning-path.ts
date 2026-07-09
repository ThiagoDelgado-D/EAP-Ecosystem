import {
  createValidationSchema,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  type ILearningPathRepository,
  type LearningPathWithNodes,
} from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

export interface GetLearningPathDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface GetLearningPathRequest {
  userId: UUID;
  pathId: UUID;
}

const getLearningPathSchema = createValidationSchema<GetLearningPathRequest>({
  userId: uuidField("UserId", { required: true }),
  pathId: uuidField("PathId", { required: true }),
});

export const getLearningPath = async (
  { learningPathRepository }: GetLearningPathDependencies,
  request: GetLearningPathRequest,
): Promise<
  LearningPathWithNodes | LearningPathNotFoundError | LearningPathForbiddenError | InvalidDataError
> => {
  const validationResult = await getLearningPathSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId } = validationResult;

  const result = await learningPathRepository.findByIdWithNodes(pathId);
  if (!result) return new LearningPathNotFoundError();
  if (result.path.userId !== userId) return new LearningPathForbiddenError();

  return result;
};
