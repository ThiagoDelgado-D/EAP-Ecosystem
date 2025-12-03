import {
  DifficultyType,
  ILearningResourceRepository,
  LearningResource,
} from "@learning-resource/domain";
import { InvalidDataError, UUID } from "domain-lib";
import { LearningResourceNotFoundError } from "../../../errors";
import { LearningResourceValidator } from "../../../validators";

export interface ToggleResourceDifficultyDependencies {
  learningResourceRepository: ILearningResourceRepository;
  validator: LearningResourceValidator;
}

export interface ToggleResourceDifficultyRequestModel {
  id: UUID;
  difficulty: DifficultyType;
}

export const toggleResourceDifficulty = async (
  {
    learningResourceRepository,
    validator,
  }: ToggleResourceDifficultyDependencies,
  request: ToggleResourceDifficultyRequestModel
): Promise<void | InvalidDataError | LearningResourceNotFoundError> => {
  const validation = await validator.isValidDifficultyToggle(request);
  if (!validation.isValid) {
    return new InvalidDataError(validation.errors);
  }

  const existingResource = await learningResourceRepository.findById(
    request.id
  );
  if (!existingResource) {
    return new LearningResourceNotFoundError();
  }

  const updated: LearningResource = {
    ...existingResource,
    difficulty: request.difficulty,
    updatedAt: new Date(),
  };

  await learningResourceRepository.update(request.id, updated);
};
