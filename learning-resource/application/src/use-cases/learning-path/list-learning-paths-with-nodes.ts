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

export interface ListLearningPathsWithNodesDependencies {
  learningPathRepository: ILearningPathRepository;
}

export interface ListLearningPathsWithNodesRequestModel {
  userId: UUID;
}

const listLearningPathsWithNodesSchema =
  createValidationSchema<ListLearningPathsWithNodesRequestModel>({
    userId: uuidField("UserId", { required: true }),
  });

export const listLearningPathsWithNodes = async (
  { learningPathRepository }: ListLearningPathsWithNodesDependencies,
  request: ListLearningPathsWithNodesRequestModel,
): Promise<LearningPathWithNodes[] | InvalidDataError> => {
  const validationResult = listLearningPathsWithNodesSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  return learningPathRepository.findAllByUserIdWithNodes(
    validationResult.userId,
  );
};
