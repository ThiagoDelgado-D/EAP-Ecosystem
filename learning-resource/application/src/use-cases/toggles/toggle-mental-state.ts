import {
  MentalStateType,
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
import { LearningResourceNotFoundError } from "../../errors/index.js";

export interface ToggleMentalStateDependencies {
  learningResourceRepository: ILearningResourceRepository;
}

export interface ToggleMentalStateRequestModel {
  id: UUID;
  mentalState: MentalStateType;
}

export const toggleMentalStateSchema =
  createValidationSchema<ToggleMentalStateRequestModel>({
    id: uuidField("ResourceId", { required: true }),
    mentalState: enumField(Object.values(MentalStateType), "MentalState", {
      required: true,
    }),
  });

export const toggleMentalState = async (
  { learningResourceRepository }: ToggleMentalStateDependencies,
  request: ToggleMentalStateRequestModel,
): Promise<void | InvalidDataError | LearningResourceNotFoundError> => {
  const validationResult = await toggleMentalStateSchema(request);

  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const validatedData = validationResult;

  const existingResource = await learningResourceRepository.findById(
    validatedData.id,
  );

  if (!existingResource) {
    return new LearningResourceNotFoundError();
  }

  await learningResourceRepository.update(validatedData.id, {
    mentalState: validatedData.mentalState,
    updatedAt: new Date(),
  });
};
