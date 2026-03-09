import type { UUID } from "domain-lib";
import type {
  IResourceTypeRepository,
  ResourceType,
} from "@learning-resource/domain";
import type { StorageAdapter } from "infrastructure-lib";

export class JsonResourceTypeRepository implements IResourceTypeRepository {
  constructor(private readonly storage: StorageAdapter<ResourceType>) {}

  async save(resourceType: ResourceType): Promise<void> {
    await this.storage.save(resourceType);
  }

  async update(id: UUID, resourceType: Partial<ResourceType>): Promise<void> {
    const existing = await this.storage.findById(id);
    if (!existing) return;
    await this.storage.save({ ...existing, ...resourceType, id });
  }

  async findAll(): Promise<ResourceType[]> {
    return this.storage.readAll();
  }

  async findById(id: UUID): Promise<ResourceType | null> {
    return (await this.storage.findById(id)) ?? null;
  }
}
