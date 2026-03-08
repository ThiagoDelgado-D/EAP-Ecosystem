import type { UUID } from "domain-lib";
import type {
  DifficultyType,
  EnergyLevelType,
  ILearningResourceRepository,
  LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { learningResourceStorage } from "../storage/index.js";

export class JsonLearningResourceRepository implements ILearningResourceRepository {
  async save(resource: LearningResource): Promise<void> {
    await learningResourceStorage.save(resource);
  }
  async update(id: UUID, resource: Partial<LearningResource>): Promise<void> {
    const existing = await learningResourceStorage.findById(id);
    if (!existing) return;
    await learningResourceStorage.save({ ...existing, ...resource, id });
  }

  async delete(id: UUID): Promise<void> {
    await learningResourceStorage.delete(id);
  }

  async findAll(): Promise<LearningResource[]> {
    return learningResourceStorage.readAll();
  }

  async findById(id: UUID): Promise<LearningResource | null> {
    return (await learningResourceStorage.findById(id)) ?? null;
  }

  async findByTopicIds(topicIds: UUID[]): Promise<LearningResource[]> {
    const all = await learningResourceStorage.readAll();
    return all.filter((r) => r.topicIds.some((id) => topicIds.includes(id)));
  }

  async findByDifficulty(
    difficulty: DifficultyType,
  ): Promise<LearningResource[]> {
    const all = await learningResourceStorage.readAll();
    return all.filter((r) => r.difficulty === difficulty);
  }

  async findByEnergyLevel(
    energy: EnergyLevelType,
  ): Promise<LearningResource[]> {
    const all = await learningResourceStorage.readAll();
    return all.filter((r) => r.energyLevel === energy);
  }

  async findByStatus(status: ResourceStatusType): Promise<LearningResource[]> {
    const all = await learningResourceStorage.readAll();
    return all.filter((r) => r.status === status);
  }

  async findByResourceTypeId(typeId: UUID): Promise<LearningResource[]> {
    const all = await learningResourceStorage.readAll();
    return all.filter((r) => r.typeId === typeId);
  }
}
