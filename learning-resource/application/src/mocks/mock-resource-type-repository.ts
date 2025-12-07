import type {
  IResourceTypeRepository,
  ResourceType,
} from "learning-resource/domain";
import type { UUID } from "domain-lib";

export interface MockedResourceTypeRepository extends IResourceTypeRepository {
  resourceTypes: ResourceType[];
}

export function mockResourceTypeRepository(
  resourceTypes: ResourceType[] = []
): MockedResourceTypeRepository {
  return {
    resourceTypes: [...resourceTypes],

    async save(resourceType: ResourceType): Promise<void> {
      const index = this.resourceTypes.findIndex(
        (rt) => rt.id === resourceType.id
      );
      if (index >= 0) {
        this.resourceTypes[index] = resourceType;
      } else {
        this.resourceTypes.push(resourceType);
      }
    },

    async findById(id: UUID): Promise<ResourceType | null> {
      return this.resourceTypes.find((rt) => rt.id === id) || null;
    },

    async findAll(): Promise<ResourceType[]> {
      return [...this.resourceTypes];
    },

    async update(id: UUID, data: Partial<ResourceType>): Promise<void> {
      const index = this.resourceTypes.findIndex((rt) => rt.id === id);

      const updatedResourceType = {
        ...this.resourceTypes[index],
        ...data,
        updatedAt: new Date(),
      };

      this.resourceTypes = this.resourceTypes.map((rt) =>
        rt.id === id ? updatedResourceType : rt
      );
    },
  };
}
