import type {
  AddResourcePayload,
  LearningResource,
  LearningResourceFilter,
} from './learning-resource.model';

export abstract class LearningResourceRepository {
  abstract getAll(): Promise<LearningResource[]>;
  abstract getByFilter(filter: LearningResourceFilter): Promise<LearningResource[]>;
  abstract getById(id: string): Promise<LearningResource>;
  abstract addResourceLearning(resource: AddResourcePayload): Promise<void>;
  abstract deleteResource(resourceId: string): Promise<void>;
}
