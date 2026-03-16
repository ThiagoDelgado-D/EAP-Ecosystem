import type { ITopicRepository, Topic } from "@learning-resource/domain";
import type { Repository } from "typeorm";
import { TopicEntity } from "../entities/topic.entity.js";
import type { UUID } from "domain-lib";

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

  async findAll(): Promise<Topic[]> {
    const entities = await this.repository.find();
    return entities.map(this.toDomain);
  }

  async findByIds(ids: string[]): Promise<Topic[]> {
    const entities = await this.repository.findByIds(ids);
    return entities.map(this.toDomain);
  }

  private toDomain(entity: TopicEntity): Topic {
    return {
      id: entity.id as Topic["id"],
      name: entity.name,
      color: entity.color,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEntity(topic: Topic): TopicEntity {
    const entity = new TopicEntity();
    entity.id = topic.id;
    entity.name = topic.name;
    entity.color = topic.color ?? "";
    entity.createdAt = topic.createdAt;
    entity.updatedAt = topic.updatedAt;
    return entity;
  }
}
