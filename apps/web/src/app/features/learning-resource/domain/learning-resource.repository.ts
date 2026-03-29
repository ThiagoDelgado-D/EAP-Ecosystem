import type { LearningResource, LearningResourceFilter } from './learning-resource.model';

export abstract class LearningResourceRepository {
  abstract getAll(): Promise<LearningResource[]>;
  abstract getByFilter(filter: LearningResourceFilter): Promise<LearningResource[]>;
  abstract getById(id: string): Promise<LearningResource>;
  abstract addResourceLearning(
    resource: Omit<LearningResource, 'id' | 'createdAt' | 'updatedAt' | 'lastViewed'>,
  ): Promise<void>;
}
