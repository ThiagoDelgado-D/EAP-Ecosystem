import {
  DifficultyType,
  EnergyLevelType,
  ILearningResourceRepository,
  ResourceStatusType,
} from "@learning-resource/domain";
import { UUID } from "domain-lib";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found";

export interface GetResourceByIdDependencies {
  learningResourceRepository: ILearningResourceRepository;
}

export interface GetResourceByIdRequestModel {
  resourceId: UUID;
}

export interface GetResourceByIdResponseModel {
  resourceId: UUID;
  title: string;
  url?: string;
  topicIds: UUID[];
  difficulty: DifficultyType;
  estimatedDurationMinutes: number;
  energyLevel?: EnergyLevelType;
  status?: ResourceStatusType;
  notes?: string;
}

export const GetResourceById = async (
  { learningResourceRepository }: GetResourceByIdDependencies,
  { resourceId }: GetResourceByIdRequestModel
): Promise<GetResourceByIdResponseModel | LearningResourceNotFoundError> => {
  const resource = await learningResourceRepository.findById(resourceId);

  if (!resource) {
    return new LearningResourceNotFoundError();
  }

  const result: GetResourceByIdResponseModel = {
    resourceId: resource.id,
    title: resource.title,
    url: resource.url,
    topicIds: resource.topicIds,
    difficulty: resource.difficulty,
    estimatedDurationMinutes: resource.estimatedDuration.value,
    energyLevel: resource.energyLevel,
    status: resource.status,
    notes: resource.notes,
  };

  return result;
};
