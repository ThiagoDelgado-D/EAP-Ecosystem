import { UUID } from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  ILearningResourceRepository,
  IResourceTypeRepository,
  ITopicRepository,
} from "learning-resource/domain";

export interface AddResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
  resourceTypeRepository: IResourceTypeRepository;
  topicRepository: ITopicRepository;
}

export interface AddResourceRequestModel {
  title: string;
  url?: string;
  resourceTypeId: UUID;
  topicIds: UUID[];
  difficulty: DifficultyType;
  energyLevel: EnergyLevelType;
}

export const addResource = async (
  { learningResourceRepository }: AddResourceDependencies,
  {
    title,
    topicIds,
    resourceTypeId,
    url,
    difficulty,
    energyLevel,
  }: AddResourceRequestModel
) => {};
