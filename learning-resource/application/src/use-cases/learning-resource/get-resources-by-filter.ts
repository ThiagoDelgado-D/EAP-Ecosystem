import {
  type ILearningResourceRepository,
  type LearningResource,
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import type { UUID } from "domain-lib";

export interface GetResourcesDependencies {
  learningResourceRepository: ILearningResourceRepository;
}

export interface GetResourcesFilters {
  topicIds?: UUID[];
  difficulty?: DifficultyType;
  energyLevel?: EnergyLevelType;
  status?: ResourceStatusType;
  resourceTypeId?: UUID;
}

export interface GetResourcesRequestModel {
  filters?: GetResourcesFilters;
}

export interface GetResourcesResponseModel {
  resources: LearningResource[];
  total: number;
}

export const getResourcesByFilter = async (
  { learningResourceRepository }: GetResourcesDependencies,
  request: GetResourcesRequestModel = {}
): Promise<GetResourcesResponseModel> => {
  const { filters } = request;

  if (!filters || Object.keys(filters).length === 0) {
    const resources = await learningResourceRepository.findAll();
    return { resources, total: resources.length };
  }

  if (filters.topicIds) {
    const resources = await learningResourceRepository.findByTopicIds(
      filters.topicIds
    );
    return { resources, total: resources.length };
  }

  if (filters.difficulty) {
    const resources = await learningResourceRepository.findByDifficulty(
      filters.difficulty
    );
    return { resources, total: resources.length };
  }

  if (filters.energyLevel) {
    const resources = await learningResourceRepository.findByEnergyLevel(
      filters.energyLevel
    );
    return { resources, total: resources.length };
  }

  if (filters.status) {
    const resources = await learningResourceRepository.findByStatus(
      filters.status
    );
    return { resources, total: resources.length };
  }

  if (filters.resourceTypeId) {
    const resources = await learningResourceRepository.findByResourceTypeId(
      filters.resourceTypeId
    );
    return { resources, total: resources.length };
  }

  const allResources = await learningResourceRepository.findAll();
  return { resources: allResources, total: allResources.length };
};
