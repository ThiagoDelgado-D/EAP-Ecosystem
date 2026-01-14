import type { ILearningResourceRepository } from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";

export interface DeleteResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
}
export interface DeleteResourceRequestModel {
  id: UUID;
}

export const deleteResource = async (
  { learningResourceRepository }: DeleteResourceDependencies,
  { id }: DeleteResourceRequestModel
): Promise<void | LearningResourceNotFoundError> => {
  const foundResource = await learningResourceRepository.findById(id);

  if (!foundResource) {
    return new LearningResourceNotFoundError();
  }

  await learningResourceRepository.delete(id);
};
