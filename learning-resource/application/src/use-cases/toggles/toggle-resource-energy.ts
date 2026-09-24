import {
  EnergyLevelType,
  type ILearningResourceRepository,
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

export interface ToggleResourceEnergyDependencies {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
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
  { learningResourceRepository, currentUser }: ToggleResourceEnergyDependencies,
  request: ToggleResourceEnergyRequestModel
): Promise<
  | void
  | InvalidDataError
  | LearningResourceNotFoundError
  | LearningResourceForbiddenError
> => {
  const validationResult = await toggleResourceEnergySchema(request);

  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const validatedData = validationResult;

  const existingResource = await verifyLearningResourceOwnership(
    learningResourceRepository,
    validatedData.id,
    currentUser,
  );
  if (isErrorResult(existingResource)) return existingResource;

  await learningResourceRepository.update(validatedData.id, {
    energyLevel: validatedData.energyLevel,
    updatedAt: new Date(),
  });
};
