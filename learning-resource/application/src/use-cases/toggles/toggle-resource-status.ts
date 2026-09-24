import {
  ResourceStatusType,
  type ILearningResourceRepository,
} from "@learning-resource/domain";
import {
  InvalidDataError,
  isErrorResult,
  type CurrentUser,
  type UUID,
  createValidationSchema,
  uuidField,
  enumField,
  ValidationError,
} from "domain-lib";
import {
  LearningResourceForbiddenError,
  LearningResourceNotFoundError,
} from "../../errors/index.js";
import { verifyLearningResourceOwnership } from "../learning-resource/verify-learning-resource-ownership.js";

export interface ToggleResourceStatusDependencies {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
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
  { learningResourceRepository, currentUser }: ToggleResourceStatusDependencies,
  request: ToggleResourceStatusRequestModel
): Promise<
  | void
  | InvalidDataError
  | LearningResourceNotFoundError
  | LearningResourceForbiddenError
> => {
  const validationResult = await toggleResourceStatusSchema(request);

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
    status: validatedData.status,
    updatedAt: new Date(),
  });
};
