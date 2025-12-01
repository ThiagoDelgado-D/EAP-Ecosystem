import { UUID } from "domain-lib";
import {
  ILearningResourceRepository,
  LearningResource,
} from "learning-resource/domain";

export interface MockedLearningResourceRepository
  extends ILearningResourceRepository {
  learningResources: LearningResource[];
}

export function mockLearningResourceRepository(
  learningResources: LearningResource[] = []
): MockedLearningResourceRepository {
  return {
    learningResources: [...learningResources],

    async save(learningResource: LearningResource): Promise<void> {
      const index = this.learningResources.findIndex(
        (r) => r.id === learningResource.id
      );
      if (index >= 0) {
        this.learningResources[index] = learningResource;
      } else {
        this.learningResources.push(learningResource);
      }
    },

    async findById(id: UUID): Promise<LearningResource | null> {
      return this.learningResources.find((r) => r.id === id) || null;
    },

    async findAll(): Promise<LearningResource[]> {
      return [...this.learningResources];
    },

    async update(id: UUID, data: Partial<LearningResource>): Promise<void> {
      const index = this.learningResources.findIndex((r) => r.id === id);

      const updatedResource = {
        ...this.learningResources[index],
        ...data,
        updatedAt: new Date(),
      };

      this.learningResources = this.learningResources.map((r) =>
        r.id === id ? updatedResource : r
      );
    },

    async delete(id: UUID): Promise<void> {
      const index = this.learningResources.findIndex((r) => r.id === id);
      if (index >= 0) {
        this.learningResources.splice(index, 1);
      }
    },
    async getAll(): Promise<LearningResource[]> {
      return this.learningResources;
    },
  };
}
