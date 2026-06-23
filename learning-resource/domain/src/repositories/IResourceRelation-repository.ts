import type { UUID } from "domain-lib";
import type { ResourceRelation, RelationType } from "../entities/resource-relation.js";

export interface RelationFilters {
  type?: RelationType;
  sourceResourceId?: UUID;
  targetResourceId?: UUID;
}

export interface IResourceRelationRepository {
  findAllByUserId(userId: UUID, filters?: RelationFilters): Promise<ResourceRelation[]>;
  findById(id: UUID): Promise<ResourceRelation | null>;
  findByResourceId(resourceId: UUID, userId: UUID): Promise<ResourceRelation[]>;
  save(relation: ResourceRelation): Promise<ResourceRelation>;
  delete(id: UUID): Promise<void>;
  existsCycle(sourceId: UUID, targetId: UUID, userId: UUID): Promise<boolean>;
}
