import {
  DifficultyType,
  type ILearningResourceRepository,
  type LearningResource,
} from "@learning-resource/domain";
import {
  createValidationSchema,
  enumField,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { LearningResourceNotFoundError } from "../../errors/index.js";

export interface ToggleResourceDifficultyDependencies {
  learningResourceRepository: ILearningResourceRepository;
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
  { learningResourceRepository }: ToggleResourceDifficultyDependencies,
  request: ToggleResourceDifficultyRequestModel
): Promise<
  void | InvalidDataError | LearningResourceNotFoundError | ValidationError
> => {
  const validationResult = toggleResourceDifficultySchema(request);
  if (validationResult instanceof ValidationError) {
    return validationResult;
  }

  const validatedData = validationResult;

  const existingResource = await learningResourceRepository.findById(
    validatedData.id
  );
  if (!existingResource) {
    return new LearningResourceNotFoundError();
  }

  const updated: LearningResource = {
    ...existingResource,
    difficulty: validatedData.difficulty,
    updatedAt: new Date(),
  };

  await learningResourceRepository.update(validatedData.id, updated);
};
