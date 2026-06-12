import type {
  ILearningResourceRepository,
  LearningResource,
  PaginatedResources,
  ResourceFilters,
  ResourcePagination,
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
    if ("imageUrl" in resource) updateData.imageUrl = resource.imageUrl ?? null;
    if ("mentalState" in resource)
      updateData.mentalState = resource.mentalState ?? null;

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
        entity.topics = await this.topicRepository.findBy({ id: In(topicIds) });
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
    const entities = await this.repository.find({ relations: ["topics"] });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: UUID): Promise<LearningResource | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ["topics", "resourceType"],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findWithFiltersAndCount(
    filters: ResourceFilters,
    pagination: ResourcePagination,
  ): Promise<PaginatedResources> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const qb = this.repository
      .createQueryBuilder("lr")
      .leftJoinAndSelect("lr.topics", "topic");

    if (filters.q) {
      qb.andWhere("LOWER(lr.title) LIKE LOWER(:q)", { q: `%${filters.q}%` });
    }
    if (filters.difficulty) {
      qb.andWhere("lr.difficulty = :difficulty", { difficulty: filters.difficulty });
    }
    if (filters.energyLevel) {
      qb.andWhere("lr.energyLevel = :energyLevel", { energyLevel: filters.energyLevel });
    }
    if (filters.status) {
      qb.andWhere("lr.status = :status", { status: filters.status });
    }
    if (filters.resourceTypeId) {
      qb.andWhere("lr.resourceTypeId = :resourceTypeId", { resourceTypeId: filters.resourceTypeId });
    }
    if (filters.mentalState) {
      qb.andWhere("lr.mentalState = :mentalState", { mentalState: filters.mentalState });
    }
    if (filters.topicIds?.length) {
      qb.innerJoin("lr.topics", "filterTopic")
        .andWhere("filterTopic.id IN (:...topicIds)", { topicIds: filters.topicIds });
    }

    const [entities, total] = await qb
      .orderBy("lr.createdAt", "DESC")
      .addOrderBy("lr.id", "ASC")
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      resources: entities.map((e) => this.toDomain(e)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findSimilarTitles(q: string, limit = 5): Promise<string[]> {
    const results = await this.repository.query(
      `SELECT title, similarity(lower(title), lower($1)) AS sim
       FROM learning_resources
       WHERE similarity(lower(title), lower($1)) > 0.15
       ORDER BY sim DESC
       LIMIT $2`,
      [q, limit],
    );
    return results.map((r: { title: string }) => r.title);
  }

  private toDomain(entity: LearningResourceEntity): LearningResource {
    return {
      id: entity.id as UUID,
      title: entity.title,
      url: entity.url ?? undefined,
      imageUrl: entity.imageUrl ?? undefined,
      typeId: (entity.resourceType?.id ?? entity.resourceTypeId) as UUID,
      topicIds: entity.topics.map((t) => t.id as UUID),
      difficulty: entity.difficulty as LearningResource["difficulty"],
      energyLevel: entity.energyLevel as LearningResource["energyLevel"],
      mentalState: (entity.mentalState as LearningResource["mentalState"]) ?? undefined,
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
    entity.imageUrl = resource.imageUrl ?? null;
    entity.notes = resource.notes ?? null;
    entity.difficulty = resource.difficulty;
    entity.energyLevel = resource.energyLevel;
    entity.mentalState = resource.mentalState ?? null;
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
