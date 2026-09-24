import {
  MentalStateType,
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

export interface ToggleMentalStateDependencies {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
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
  { learningResourceRepository, currentUser }: ToggleMentalStateDependencies,
  request: ToggleMentalStateRequestModel,
): Promise<
  | void
  | InvalidDataError
  | LearningResourceNotFoundError
  | LearningResourceForbiddenError
> => {
  const validationResult = await toggleMentalStateSchema(request);

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
    mentalState: validatedData.mentalState,
    updatedAt: new Date(),
  });
};
