import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import type { ResourceType } from '@features/learning-resource/domain/resource-type.model';

export interface MockedResourceTypeRepository extends ResourceTypeRepository {
  resourceTypes: ResourceType[];
  reset(): void;
}

export function mockResourceTypeRepository(
  initial: { resourceTypes?: ResourceType[] } = {},
): MockedResourceTypeRepository {
  return {
    resourceTypes: [...(initial.resourceTypes ?? [])],

    async getAll(): Promise<ResourceType[]> {
      return this.resourceTypes;
    },

    reset(): void {
      this.resourceTypes = [];
    },
  };
}
