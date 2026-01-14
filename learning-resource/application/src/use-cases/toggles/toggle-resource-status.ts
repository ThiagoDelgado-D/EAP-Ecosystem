import {
  ResourceStatusType,
  type ILearningResourceRepository,
} from "@learning-resource/domain";
import {
  InvalidDataError,
  type UUID,
  createValidationSchema,
  uuidField,
  enumField,
  ValidationError,
} from "domain-lib";
import { LearningResourceNotFoundError } from "../../errors/index.js";

export interface ToggleResourceStatusDependencies {
  learningResourceRepository: ILearningResourceRepository;
}

export interface ToggleResourceStatusRequestModel {
  id: UUID;
  status: ResourceStatusType;
}

export const toggleResourceStatusSchema =
  createValidationSchema<ToggleResourceStatusRequestModel>({
    id: uuidField("ResourceId", { required: true }),
    status: enumField(Object.values(ResourceStatusType), "Status", {
      required: true,
    }),
  });

export const toggleStatus = async (
  { learningResourceRepository }: ToggleResourceStatusDependencies,
  request: ToggleResourceStatusRequestModel
): Promise<void | InvalidDataError | LearningResourceNotFoundError> => {
  const validationResult = await toggleResourceStatusSchema(request);

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
    status: validatedData.status,
    updatedAt: new Date(),
  });
};
