import type {
  IResourceTypeRepository,
  ResourceType,
} from "@learning-resource/domain";
import type { Repository } from "typeorm";
import { ResourceTypeEntity } from "../entities/resource-type.entity.js";
import type { UUID } from "domain-lib";

export class TypeOrmResourceTypeRepository implements IResourceTypeRepository {
  constructor(private readonly repository: Repository<ResourceTypeEntity>) {}

  async save(resourceType: ResourceType): Promise<void> {
    const entity = this.toEntity(resourceType);
    await this.repository.save(entity);
  }

  async update(id: UUID, resourceType: Partial<ResourceType>): Promise<void> {
    await this.repository.update(id, resourceType);
  }

  async findAll(): Promise<ResourceType[]> {
    const entities = await this.repository.find();
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: UUID): Promise<ResourceType | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  private toDomain(entity: ResourceTypeEntity): ResourceType {
    return {
      id: entity.id as UUID,
      code: entity.code,
      displayName: entity.displayName,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEntity(resourceType: ResourceType): ResourceTypeEntity {
    const entity = new ResourceTypeEntity();
    entity.id = resourceType.id;
    entity.code = resourceType.code;
    entity.displayName = resourceType.displayName;
    entity.isActive = resourceType.isActive ?? true;
    entity.createdAt = resourceType.createdAt;
    entity.updatedAt = resourceType.updatedAt;
    return entity;
  }
}
