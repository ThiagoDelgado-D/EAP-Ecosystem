import { ILearningResourceRepository } from "@learning-resource/domain";
import { UUID } from "domain-lib";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found";

export interface DeleteResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
}
export interface DeleteResourceRequestModel {
  id: UUID;
}

export const deleteResource = async (
  { learningResourceRepository }: DeleteResourceDependencies,
  { id }: DeleteResourceRequestModel
) => {
  const foundResource = await learningResourceRepository.findById(id);

  if (!foundResource) {
    return new LearningResourceNotFoundError();
  }

  await learningResourceRepository.delete(id);
};
