import type { ILearningResourceRepository } from "@learning-resource/domain";
import {
  LearningResourceForbiddenError,
  LearningResourceNotFoundError,
} from "../../errors/index.js";
import { verifyLearningResourceOwnership } from "./verify-learning-resource-ownership.js";
import {
  createValidationSchema,
  type CurrentUser,
  InvalidDataError,
  isErrorResult,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";

export interface DeleteResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
}
export interface DeleteResourceRequestModel {
  id: UUID;
}

export const deleteResourceSchema =
  createValidationSchema<DeleteResourceRequestModel>({
    id: uuidField("ResourceId", { required: true }),
  });

export const deleteResource = async (
  { learningResourceRepository, currentUser }: DeleteResourceDependencies,
  { id }: DeleteResourceRequestModel
): Promise<
  | void
  | LearningResourceNotFoundError
  | LearningResourceForbiddenError
  | InvalidDataError
> => {
  const validationResult = deleteResourceSchema({ id });

  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const existingResource = await verifyLearningResourceOwnership(
    learningResourceRepository,
    validationResult.id,
    currentUser,
  );
  if (isErrorResult(existingResource)) return existingResource;

  await learningResourceRepository.delete(validationResult.id);
};
