import type {
  ITopicRepository,
  Topic,
  TopicTone,
  TopicWithUsage,
} from "@learning-resource/domain";
import { type Repository } from "typeorm";
import { TopicEntity } from "../entities/topic.entity.js";
import type { UUID } from "domain-lib";

interface TopicWithUsageRow {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  resourceCount: number;
}

export class TypeOrmTopicRepository implements ITopicRepository {
  constructor(private readonly repository: Repository<TopicEntity>) {}

  async save(topic: Topic): Promise<void> {
    const entity = this.toEntity(topic);
    await this.repository.save(entity);
  }

  async update(id: UUID, topic: Partial<Topic>): Promise<void> {
    await this.repository.update(id, topic);
  }

  async delete(id: UUID): Promise<void> {
    await this.repository.delete(id);
  }

  async findById(id: UUID): Promise<Topic | null> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAllByUserId(userId: UUID): Promise<TopicWithUsage[]> {
    const rows: TopicWithUsageRow[] = await this.repository.query(
      `SELECT t.id, t."userId", t.name, t.color, t."createdAt", t."updatedAt",
              COUNT(lrt."learningResourceId")::int AS "resourceCount"
       FROM topics t
       LEFT JOIN learning_resource_topics lrt ON lrt."topicId" = t.id
       WHERE t."userId" = $1
       GROUP BY t.id
       ORDER BY LOWER(t.name)`,
      [userId],
    );
    return rows.map((row) => ({
      id: row.id as UUID,
      userId: row.userId as UUID,
      name: row.name,
      color: row.color as TopicTone,
      resourceCount: row.resourceCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async findByName(userId: UUID, name: string): Promise<Topic | null> {
    const entity = await this.repository
      .createQueryBuilder("t")
      .where("t.userId = :userId", { userId })
      .andWhere("LOWER(t.name) = LOWER(:name)", { name })
      .getOne();

    if (!entity) return null;
    return this.toDomain(entity);
  }

  private toDomain(entity: TopicEntity): Topic {
    return {
      id: entity.id as UUID,
      userId: entity.userId as UUID,
      name: entity.name,
      color: entity.color as TopicTone,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEntity(topic: Topic): TopicEntity {
    const entity = new TopicEntity();
    entity.id = topic.id;
    entity.userId = topic.userId;
    entity.name = topic.name;
    entity.color = topic.color;
    entity.createdAt = topic.createdAt;
    entity.updatedAt = topic.updatedAt;
    return entity;
  }
}
