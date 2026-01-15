import type { UUID } from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
} from "../entities/learning-resource.js";

export interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  update(id: UUID, resource: Partial<LearningResource>): Promise<void>;
  delete(id: UUID): Promise<void>;
  findAll(): Promise<LearningResource[]>;
  findById(id: UUID): Promise<LearningResource | null>;
  findByTopicIds(topicIds: UUID[]): Promise<LearningResource[]>;
  findByDifficulty(difficulty: DifficultyType): Promise<LearningResource[]>;
  findByEnergyLevel(energy: EnergyLevelType): Promise<LearningResource[]>;
  findByStatus(status: ResourceStatusType): Promise<LearningResource[]>;
  findByResourceTypeId(typeId: UUID): Promise<LearningResource[]>;
}
