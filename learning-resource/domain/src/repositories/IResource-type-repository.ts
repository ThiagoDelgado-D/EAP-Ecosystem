import type { UUID } from "domain-lib";
import type { ResourceType } from "../entities/resource-type";

export interface IResourceTypeRepository {
  save(resourceType: ResourceType): Promise<void>;
  update(id: UUID, resourceType: Partial<ResourceType>): Promise<void>;
  findAll(): Promise<ResourceType[]>;
  findById(id: UUID): Promise<ResourceType | null>;
}
