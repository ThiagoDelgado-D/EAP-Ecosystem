import type {
  AddResourcePayload,
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
  LearningResourceFilter,
  MentalStateType,
  ResourceStatus,
  UpdateResourcePayload,
} from './learning-resource.model';

export abstract class LearningResourceRepository {
  abstract getAll(): Promise<LearningResource[]>;
  abstract getByFilter(filter: LearningResourceFilter): Promise<LearningResource[]>;
  abstract getById(id: string): Promise<LearningResource>;
  abstract addResourceLearning(resource: AddResourcePayload): Promise<void>;
  abstract updateResource(id: string, payload: UpdateResourcePayload): Promise<void>;
  abstract deleteResource(resourceId: string): Promise<void>;

  abstract toggleDifficulty(id: string, difficulty: DifficultyLevel): Promise<void>;
  abstract toggleEnergy(id: string, energyLevel: EnergyLevel): Promise<void>;
  abstract toggleStatus(id: string, status: ResourceStatus): Promise<void>;
  abstract toggleMentalState(id: string, mentalState: MentalStateType): Promise<void>;
}
