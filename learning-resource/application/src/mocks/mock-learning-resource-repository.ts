import type { UUID } from "domain-lib";
import type {
  ILearningResourceRepository,
  LearningResource,
  PaginatedResources,
  ResourceFilters,
  ResourcePagination,
} from "@learning-resource/domain";

export interface MockedLearningResourceRepository extends ILearningResourceRepository {
  learningResources: LearningResource[];
  reset(): void;
  clear(): void;
  count(): number;
}

export function mockLearningResourceRepository(
  learningResources: LearningResource[] = [],
): MockedLearningResourceRepository {
  return {
    learningResources: [...learningResources],

    async save(learningResource: LearningResource): Promise<void> {
      const index = this.learningResources.findIndex(
        (r) => r.id === learningResource.id,
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
        r.id === id ? updatedResource : r,
      );
    },

    async delete(id: UUID): Promise<void> {
      const index = this.learningResources.findIndex((r) => r.id === id);
      if (index >= 0) {
        this.learningResources.splice(index, 1);
      }
    },

    async findWithFiltersAndCount(
      filters: ResourceFilters,
      pagination: ResourcePagination,
    ): Promise<PaginatedResources> {
      const { page, pageSize } = pagination;
      let results = [...this.learningResources];

      if (filters.q) {
        const q = filters.q.toLowerCase();
        results = results.filter((r) => r.title.toLowerCase().includes(q));
      }
      if (filters.difficulty) {
        results = results.filter((r) => r.difficulty === filters.difficulty);
      }
      if (filters.energyLevel) {
        results = results.filter((r) => r.energyLevel === filters.energyLevel);
      }
      if (filters.status) {
        results = results.filter((r) => r.status === filters.status);
      }
      if (filters.resourceTypeId) {
        results = results.filter((r) => r.typeId === filters.resourceTypeId);
      }
      if (filters.mentalState) {
        results = results.filter((r) => r.mentalState === filters.mentalState);
      }
      if (filters.topicIds?.length) {
        results = results.filter((r) =>
          r.topicIds.some((id) => filters.topicIds!.includes(id as UUID)),
        );
      }

      const total = results.length;
      const skip = (page - 1) * pageSize;
      const resources = results.slice(skip, skip + pageSize);

      return {
        resources,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },

    async findSimilarTitles(q: string, limit = 5): Promise<string[]> {
      const lower = q.toLowerCase();
      return this.learningResources
        .filter((r) => r.title.toLowerCase().includes(lower))
        .map((r) => r.title)
        .slice(0, limit);
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
