import type { UUID } from "domain-lib";
import type {
  DifficultyType,
  EnergyLevelType,
  ILearningResourceRepository,
  LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import type { StorageAdapter } from "infrastructure-lib";

export class JsonLearningResourceRepository implements ILearningResourceRepository {
  constructor(private readonly storage: StorageAdapter<LearningResource>) {}

  async save(resource: LearningResource): Promise<void> {
    await this.storage.save(resource);
  }

  async update(id: UUID, resource: Partial<LearningResource>): Promise<void> {
    const existing = await this.storage.findById(id);
    if (!existing) return;
    await this.storage.save({ ...existing, ...resource, id });
  }

  async delete(id: UUID): Promise<void> {
    await this.storage.delete(id);
  }

  async findAll(): Promise<LearningResource[]> {
    return this.storage.readAll();
  }

  async findById(id: UUID): Promise<LearningResource | null> {
    return (await this.storage.findById(id)) ?? null;
  }

  async findByTopicIds(topicIds: UUID[]): Promise<LearningResource[]> {
    const all = await this.storage.readAll();
    return all.filter((r) => r.topicIds.some((id) => topicIds.includes(id)));
  }

  async findByDifficulty(
    difficulty: DifficultyType,
  ): Promise<LearningResource[]> {
    const all = await this.storage.readAll();
    return all.filter((r) => r.difficulty === difficulty);
  }

  async findByEnergyLevel(
    energy: EnergyLevelType,
  ): Promise<LearningResource[]> {
    const all = await this.storage.readAll();
    return all.filter((r) => r.energyLevel === energy);
  }

  async findByStatus(status: ResourceStatusType): Promise<LearningResource[]> {
    const all = await this.storage.readAll();
    return all.filter((r) => r.status === status);
  }

  async findByResourceTypeId(typeId: UUID): Promise<LearningResource[]> {
    const all = await this.storage.readAll();
    return all.filter((r) => r.typeId === typeId);
  }
}
