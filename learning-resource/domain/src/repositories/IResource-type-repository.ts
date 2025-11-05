import { UUID } from "domain-lib";
import { ResourceType } from "../entities/resource-type";

export interface IResourceTypeRepository {
  save(resourceType: ResourceType): Promise<void>;
  update(id: UUID, resourceType: Partial<ResourceType>): Promise<ResourceType>;
  findAll(): Promise<ResourceType[]>;
  findById(id: UUID): Promise<ResourceType | null>;
}
