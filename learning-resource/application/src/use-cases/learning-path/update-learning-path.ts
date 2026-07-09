import {
  createValidationSchema,
  InvalidDataError,
  optionalString,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  type ILearningPathRepository,
  type LearningPath,
} from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

export interface UpdateLearningPathDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface UpdateLearningPathRequest {
  userId: UUID;
  pathId: UUID;
  title?: string;
  description?: string;
}

const updateLearningPathSchema = createValidationSchema<UpdateLearningPathRequest>({
  userId: uuidField("UserId", { required: true }),
  pathId: uuidField("PathId", { required: true }),
  title: optionalString("Title", { maxLength: 200 }),
  description: optionalString("Description", { maxLength: 1000 }),
});

export const updateLearningPath = async (
  { learningPathRepository }: UpdateLearningPathDependencies,
  request: UpdateLearningPathRequest,
): Promise<
  LearningPath | LearningPathNotFoundError | LearningPathForbiddenError | InvalidDataError
> => {
  const validationResult = await updateLearningPathSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId, title, description } = validationResult;

  const existing = await learningPathRepository.findById(pathId);
  if (!existing) return new LearningPathNotFoundError();
  if (existing.userId !== userId) return new LearningPathForbiddenError();

  return learningPathRepository.update(pathId, { title, description });
};
