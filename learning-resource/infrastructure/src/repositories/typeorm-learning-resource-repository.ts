import type {
  DifficultyType,
  EnergyLevelType,
  ILearningResourceRepository,
  LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { In, type Repository } from "typeorm";
import { LearningResourceEntity } from "../entities/learning-resource.entity.js";
import type { TopicEntity } from "../entities/topic.entity.js";
import type { UUID } from "domain-lib";

export class TypeOrmLearningResourceRepository implements ILearningResourceRepository {
  constructor(
    private readonly repository: Repository<LearningResourceEntity>,
    private readonly topicRepository: Repository<TopicEntity>,
  ) {}

  async save(resource: LearningResource): Promise<void> {
    const entity = await this.toEntity(resource);
    await this.repository.save(entity);
  }

  async update(id: UUID, resource: Partial<LearningResource>): Promise<void> {
    const { estimatedDuration, topicIds, typeId, lastViewed, ...rest } =
      resource;

    const updateData: Partial<LearningResourceEntity> = { ...rest };

    if ("url" in resource) updateData.url = resource.url ?? null;
    if ("notes" in resource) updateData.notes = resource.notes ?? null;

    if (estimatedDuration !== undefined) {
      updateData.estimatedDurationMinutes = estimatedDuration.value;
      updateData.isDurationEstimated = estimatedDuration.isEstimated;
    }

    if (typeId !== undefined) {
      updateData.resourceTypeId = typeId;
    }

    if (lastViewed !== undefined) {
      updateData.lastViewedAt = lastViewed;
    }

    if (topicIds !== undefined) {
      const entity = await this.repository.findOne({
        where: { id },
        relations: ["topics"],
      });
      if (entity) {
        entity.topics = await this.topicRepository.findBy({
          id: In(topicIds),
        });
        await this.repository.save(entity);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(id, updateData);
    }
  }

  async delete(id: UUID): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<LearningResource[]> {
    const entities = await this.repository.find({
      relations: ["topics"],
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: UUID): Promise<LearningResource | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ["topics"],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByTopicIds(topicIds: UUID[]): Promise<LearningResource[]> {
    const entities = await this.repository
      .createQueryBuilder("lr")
      .innerJoin("lr.topics", "topic")
      .where("topic.id IN (:...topicIds)", { topicIds })
      .leftJoinAndSelect("lr.topics", "allTopics")
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByDifficulty(
    difficulty: DifficultyType,
  ): Promise<LearningResource[]> {
    const entities = await this.repository.find({
      where: { difficulty },
      relations: ["topics"],
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByEnergyLevel(
    energyLevel: EnergyLevelType,
  ): Promise<LearningResource[]> {
    const entities = await this.repository.find({
      where: { energyLevel },
      relations: ["topics"],
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByStatus(status: ResourceStatusType): Promise<LearningResource[]> {
    const entities = await this.repository.find({
      where: { status },
      relations: ["topics"],
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByResourceTypeId(typeId: UUID): Promise<LearningResource[]> {
    const entities = await this.repository.find({
      where: { resourceTypeId: typeId },
      relations: ["topics"],
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: LearningResourceEntity): LearningResource {
    return {
      id: entity.id as UUID,
      title: entity.title,
      url: entity.url ?? undefined,
      typeId: entity.resourceTypeId as UUID,
      topicIds: entity.topics.map((t) => t.id as UUID),
      difficulty: entity.difficulty as LearningResource["difficulty"],
      energyLevel: entity.energyLevel as LearningResource["energyLevel"],
      status: entity.status as LearningResource["status"],
      estimatedDuration: {
        value: entity.estimatedDurationMinutes ?? 0,
        isEstimated: entity.isDurationEstimated,
      },
      lastViewed: entity.lastViewedAt ?? undefined,
      notes: entity.notes ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private async toEntity(
    resource: LearningResource,
  ): Promise<LearningResourceEntity> {
    const entity = new LearningResourceEntity();
    entity.id = resource.id;
    entity.title = resource.title;
    entity.url = resource.url ?? null;
    entity.notes = resource.notes ?? null;
    entity.difficulty = resource.difficulty;
    entity.energyLevel = resource.energyLevel;
    entity.status = resource.status;
    entity.estimatedDurationMinutes = resource.estimatedDuration.value;
    entity.isDurationEstimated = resource.estimatedDuration.isEstimated;
    entity.resourceTypeId = resource.typeId;
    entity.lastViewedAt = resource.lastViewed ?? null;
    entity.createdAt = resource.createdAt;
    entity.updatedAt = resource.updatedAt;
    entity.topics = await this.topicRepository.findBy({
      id: In(resource.topicIds),
    });
    return entity;
  }
}
