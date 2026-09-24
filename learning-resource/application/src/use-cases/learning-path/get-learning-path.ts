import {
  createValidationSchema,
  type CurrentUser,
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
  currentUser: CurrentUser;
}

export interface GetLearningPathRequest {
  pathId: UUID;
}

const getLearningPathSchema = createValidationSchema<GetLearningPathRequest>({
  pathId: uuidField("PathId", { required: true }),
});

export const getLearningPath = async (
  { learningPathRepository, currentUser }: GetLearningPathDependencies,
  request: GetLearningPathRequest,
): Promise<
  LearningPathWithNodes | LearningPathNotFoundError | LearningPathForbiddenError | InvalidDataError
> => {
  const validationResult = await getLearningPathSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { pathId } = validationResult;

  const result = await learningPathRepository.findByIdWithNodes(pathId);
  if (!result) return new LearningPathNotFoundError();
  if (result.path.userId !== currentUser.id) return new LearningPathForbiddenError();

  return result;
};
