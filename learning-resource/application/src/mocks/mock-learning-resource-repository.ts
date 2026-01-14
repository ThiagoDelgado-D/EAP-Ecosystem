import type { UUID } from "domain-lib";
import type {
  ILearningResourceRepository,
  LearningResource,
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";

export interface MockedLearningResourceRepository
  extends ILearningResourceRepository {
  learningResources: LearningResource[];
  reset(): void;
  clear(): void;
  count(): number;
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

    async findByTopicIds(topicIds: UUID[]): Promise<LearningResource[]> {
      return this.learningResources.filter((r) =>
        r.topicIds.some((topicId) => topicIds.includes(topicId))
      );
    },

    async findByDifficulty(
      difficulty: DifficultyType
    ): Promise<LearningResource[]> {
      return this.learningResources.filter((r) => r.difficulty === difficulty);
    },

    async findByEnergyLevel(
      energyLevel: EnergyLevelType
    ): Promise<LearningResource[]> {
      return this.learningResources.filter(
        (r) => r.energyLevel === energyLevel
      );
    },

    async findByStatus(
      status: ResourceStatusType
    ): Promise<LearningResource[]> {
      return this.learningResources.filter((r) => r.status === status);
    },

    async findByResourceTypeId(typeId: UUID): Promise<LearningResource[]> {
      return this.learningResources.filter((r) => r.typeId === typeId);
    },

    reset(): void {
      this.learningResources = [];
    },

    clear(): void {
      this.learningResources = [];
    },

    count(): number {
      return this.learningResources.length;
    },
  };
}
