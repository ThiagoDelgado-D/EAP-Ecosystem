import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type {
  AddResourcePayload,
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
  LearningResourceFilter,
  MentalStateType,
  ResourceStatus,
  UpdateResourcePayload,
} from '@features/learning-resource/domain/learning-resource.model';

export interface MockedLearningResourceRepository extends LearningResourceRepository {
  resources: LearningResource[];
  reset(): void;
}

export function mockLearningResourceRepository(
  initial: { resources?: LearningResource[] } = {},
): MockedLearningResourceRepository {
  return {
    resources: [...(initial.resources ?? [])],

    async getAll(): Promise<LearningResource[]> {
      return this.resources;
    },

    async getByFilter(filter: LearningResourceFilter): Promise<LearningResource[]> {
      return this.resources.filter((resource) => {
        if (filter.difficulty && resource.difficulty !== filter.difficulty) return false;
        if (filter.energyLevel && resource.energyLevel !== filter.energyLevel) return false;
        if (filter.mentalState && resource.mentalState !== filter.mentalState) return false;
        if (filter.status && resource.status !== filter.status) return false;
        if (filter.typeId && resource.typeId !== filter.typeId) return false;
        if (filter.topicIds && !filter.topicIds.every((id) => resource.topicIds.includes(id))) {
          return false;
        }
        return true;
      });
    },

    async getById(id: string): Promise<LearningResource> {
      const resource = this.resources.find((r) => r.id === id);
      if (!resource) throw new Error(`LearningResource not found: ${id}`);
      return resource;
    },

    async addResourceLearning(payload: AddResourcePayload): Promise<LearningResource> {
      const now = new Date();
      const resource: LearningResource = {
        id: crypto.randomUUID(),
        title: payload.title,
        url: payload.url,
        imageUrl: payload.imageUrl,
        notes: payload.notes,
        difficulty: payload.difficulty,
        energyLevel: payload.energyLevel ?? 'Medium',
        mentalState: payload.mentalState,
        status: payload.status ?? 'Pending',
        estimatedDuration: { value: payload.estimatedDurationMinutes, isEstimated: true },
        topicIds: payload.topicIds,
        typeId: payload.resourceTypeId,
        createdAt: now,
        updatedAt: now,
      };
      this.resources.push(resource);
      return resource;
    },

    async updateResource(id: string, payload: UpdateResourcePayload): Promise<void> {
      const index = this.resources.findIndex((r) => r.id === id);
      const existing = this.resources[index]!;
      const { estimatedDurationMinutes, ...rest } = payload;
      this.resources[index] = {
        ...existing,
        ...rest,
        estimatedDuration:
          estimatedDurationMinutes !== undefined
            ? { value: estimatedDurationMinutes, isEstimated: false }
            : existing.estimatedDuration,
        updatedAt: new Date(),
      };
    },

    async deleteResource(resourceId: string): Promise<void> {
      this.resources = this.resources.filter((r) => r.id !== resourceId);
    },

    async toggleDifficulty(id: string, difficulty: DifficultyLevel): Promise<void> {
      const index = this.resources.findIndex((r) => r.id === id);
      this.resources[index] = { ...this.resources[index]!, difficulty, updatedAt: new Date() };
    },

    async toggleEnergy(id: string, energyLevel: EnergyLevel): Promise<void> {
      const index = this.resources.findIndex((r) => r.id === id);
      this.resources[index] = { ...this.resources[index]!, energyLevel, updatedAt: new Date() };
    },

    async toggleStatus(id: string, status: ResourceStatus): Promise<void> {
      const index = this.resources.findIndex((r) => r.id === id);
      this.resources[index] = { ...this.resources[index]!, status, updatedAt: new Date() };
    },

    async toggleMentalState(id: string, mentalState: MentalStateType): Promise<void> {
      const index = this.resources.findIndex((r) => r.id === id);
      this.resources[index] = { ...this.resources[index]!, mentalState, updatedAt: new Date() };
    },

    reset(): void {
      this.resources = [];
    },
  };
}
