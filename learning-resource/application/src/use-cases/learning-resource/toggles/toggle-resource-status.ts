import {
  ILearningResourceRepository,
  ResourceStatusType,
} from "@learning-resource/domain";
import { LearningResourceValidator } from "../../../validators";
import { InvalidDataError, UUID } from "domain-lib";
import { LearningResourceNotFoundError } from "../../../errors";

export interface ToggleResourceStatusDependencies {
  learningResourceRepository: ILearningResourceRepository;
  validator: LearningResourceValidator;
}

export interface ToggleResourceStatusRequestModel {
  id: UUID;
  status: ResourceStatusType;
}

export const toggleStatus = async (
  { learningResourceRepository, validator }: ToggleResourceStatusDependencies,
  request: ToggleResourceStatusRequestModel
): Promise<void | InvalidDataError | LearningResourceNotFoundError> => {
  const validation = await validator.isValidStatusToggle(request);

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
    status: request.status,
    updatedAt: new Date(),
  });
};
