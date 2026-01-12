import {
  EnergyLevelType,
  type ILearningResourceRepository,
} from "@learning-resource/domain";
import {
  createValidationSchema,
  enumField,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { LearningResourceNotFoundError } from "../../../errors";

export interface ToggleResourceEnergyDependencies {
  learningResourceRepository: ILearningResourceRepository;
}

export interface ToggleResourceEnergyRequestModel {
  id: UUID;
  energyLevel: EnergyLevelType;
}

export const toggleResourceEnergySchema =
  createValidationSchema<ToggleResourceEnergyRequestModel>({
    id: uuidField("ResourceId", { required: true }),
    energyLevel: enumField(Object.values(EnergyLevelType), "EnergyLevel", {
      required: true,
    }),
  });

export const toggleResourceEnergy = async (
  { learningResourceRepository }: ToggleResourceEnergyDependencies,
  request: ToggleResourceEnergyRequestModel
): Promise<void | InvalidDataError | LearningResourceNotFoundError> => {
  const validationResult = await toggleResourceEnergySchema(request);

  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const validatedData = validationResult;

  const existingResource = await learningResourceRepository.findById(
    validatedData.id
  );

  if (!existingResource) {
    return new LearningResourceNotFoundError();
  }

  await learningResourceRepository.update(validatedData.id, {
    energyLevel: validatedData.energyLevel,
    updatedAt: new Date(),
  });
};
