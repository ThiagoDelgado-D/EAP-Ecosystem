import {
  createValidationSchema,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  type ILearningPathRepository,
  type LearningPath,
} from "@learning-resource/domain";

export interface ListLearningPathsDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface ListLearningPathsRequest {
  userId: UUID;
}

const listLearningPathsSchema = createValidationSchema<ListLearningPathsRequest>({
  userId: uuidField("UserId", { required: true }),
});

export const listLearningPaths = async (
  { learningPathRepository }: ListLearningPathsDependencies,
  request: ListLearningPathsRequest,
): Promise<LearningPath[] | InvalidDataError> => {
  const validationResult = await listLearningPathsSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  return learningPathRepository.findAllByUserId(validationResult.userId);
};
