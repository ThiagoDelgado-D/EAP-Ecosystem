import type { UUID } from "domain-lib";
import type { ITopicRepository, Topic } from "@learning-resource/domain";
import type { StorageAdapter } from "infrastructure-lib";

export class JsonTopicRepository implements ITopicRepository {
  constructor(private readonly storage: StorageAdapter<Topic>) {}

  async save(topic: Topic): Promise<void> {
    await this.storage.save(topic);
  }

  async update(id: UUID, topic: Partial<Topic>): Promise<void> {
    const existing = await this.storage.findById(id);
    if (!existing) return;
    const cleanPatch = Object.fromEntries(
      Object.entries(topic).filter(([, v]) => v !== undefined),
    ) as Partial<Topic>;
    await this.storage.save({ ...existing, ...cleanPatch, id });
  }

  async delete(id: UUID): Promise<void> {
    await this.storage.delete(id);
  }

  async findAll(): Promise<Topic[]> {
    return this.storage.readAll();
  }

  async findById(id: UUID): Promise<Topic | null> {
    return (await this.storage.findById(id)) ?? null;
  }
}
