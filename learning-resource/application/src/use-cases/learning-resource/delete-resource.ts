import type { ILearningResourceRepository } from "@learning-resource/domain";
import {
  createValidationSchema,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found";

export interface DeleteResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
}
export interface DeleteResourceRequestModel {
  id: UUID;
}

export const deleteResourceSchema =
  createValidationSchema<DeleteResourceRequestModel>({
    id: uuidField("ResourceId", { required: true }),
  });

export const deleteResource = async (
  { learningResourceRepository }: DeleteResourceDependencies,
  { id }: DeleteResourceRequestModel
): Promise<void | LearningResourceNotFoundError | InvalidDataError> => {
  const validationResult = deleteResourceSchema({ id });

  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const validatedId = validationResult.id;
  const foundResource = await learningResourceRepository.findById(validatedId);

  if (!foundResource) {
    return new LearningResourceNotFoundError();
  }

  await learningResourceRepository.delete(validatedId);
};
