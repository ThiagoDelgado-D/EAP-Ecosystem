import {
  EnergyLevelType,
  type ILearningResourceRepository,
} from "@learning-resource/domain";
import type { LearningResourceValidator } from "../../../validators";
import { InvalidDataError, type UUID } from "domain-lib";
import { LearningResourceNotFoundError } from "../../../errors";

export interface ToggleResourceEnergyDependencies {
  learningResourceRepository: ILearningResourceRepository;
  validator: LearningResourceValidator;
}

export interface ToggleResourceEnergyRequestModel {
  id: UUID;
  energyLevel: EnergyLevelType;
}

export const toggleResourceEnergy = async (
  { learningResourceRepository, validator }: ToggleResourceEnergyDependencies,
  request: ToggleResourceEnergyRequestModel
): Promise<void | InvalidDataError | LearningResourceNotFoundError> => {
  const validation = await validator.isValidEnergyLevelToggle(request);

  if (!validation.isValid) {
    return new InvalidDataError(validation.errors);
  }

  const existingResource = await learningResourceRepository.findById(
    request.id
  );

  if (!existingResource) {
    return new LearningResourceNotFoundError();
  }

  await learningResourceRepository.update(request.id, {
    energyLevel: request.energyLevel,
    updatedAt: new Date(),
  });
};
