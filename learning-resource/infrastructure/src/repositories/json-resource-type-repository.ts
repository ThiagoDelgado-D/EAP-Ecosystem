import type { UUID } from "domain-lib";
import type {
  IResourceTypeRepository,
  ResourceType,
} from "@learning-resource/domain";
import { resourceTypeStorage } from "../storage/index.js";

export class JsonResourceTypeRepository implements IResourceTypeRepository {
  async save(resourceType: ResourceType): Promise<void> {
    await resourceTypeStorage.save(resourceType);
  }

  async update(id: UUID, resourceType: Partial<ResourceType>): Promise<void> {
    const existing = await resourceTypeStorage.findById(id);
    if (!existing) return;
    await resourceTypeStorage.save({ ...existing, ...resourceType, id });
  }

  async findAll(): Promise<ResourceType[]> {
    return resourceTypeStorage.readAll();
  }

  async findById(id: UUID): Promise<ResourceType | null> {
    return (await resourceTypeStorage.findById(id)) ?? null;
  }
}
