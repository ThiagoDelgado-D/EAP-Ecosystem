import {
  DifficultyType,
  type ILearningResourceRepository,
  type LearningResource,
} from "@learning-resource/domain";
import {
  createValidationSchema,
  type CurrentUser,
  enumField,
  InvalidDataError,
  isErrorResult,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  LearningResourceForbiddenError,
  LearningResourceNotFoundError,
} from "../../errors/index.js";
import { verifyLearningResourceOwnership } from "../learning-resource/verify-learning-resource-ownership.js";

export interface ToggleResourceDifficultyDependencies {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
}

export interface ToggleResourceDifficultyRequestModel {
  id: UUID;
  difficulty: DifficultyType;
}

export const toggleResourceDifficultySchema =
  createValidationSchema<ToggleResourceDifficultyRequestModel>({
    id: uuidField("ResourceId", { required: true }),
    difficulty: enumField(
      Object.values(DifficultyType) as DifficultyType[],
      "Difficulty",
      { required: true }
    ),
  });

export const toggleResourceDifficulty = async (
  { learningResourceRepository, currentUser }: ToggleResourceDifficultyDependencies,
  request: ToggleResourceDifficultyRequestModel
): Promise<
  | void
  | InvalidDataError
  | LearningResourceNotFoundError
  | LearningResourceForbiddenError
  | ValidationError
> => {
  const validationResult = toggleResourceDifficultySchema(request);
  if (validationResult instanceof ValidationError) {
    return validationResult;
  }

  const validatedData = validationResult;

  const existingResource = await verifyLearningResourceOwnership(
    learningResourceRepository,
    validatedData.id,
    currentUser,
  );
  if (isErrorResult(existingResource)) return existingResource;

  const updated: LearningResource = {
    ...existingResource,
    difficulty: validatedData.difficulty,
    updatedAt: new Date(),
  };

  await learningResourceRepository.update(validatedData.id, updated);
};
