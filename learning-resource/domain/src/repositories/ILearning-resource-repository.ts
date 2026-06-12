import type { UUID } from "domain-lib";
import type { LearningResource } from "../entities/learning-resource.js";

export interface ResourceFilters {
  topicIds?: UUID[];
  difficulty?: string;
  energyLevel?: string;
  status?: string;
  resourceTypeId?: UUID;
  mentalState?: string;
  q?: string;
}

export interface ResourcePagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResources {
  resources: LearningResource[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  update(id: UUID, resource: Partial<LearningResource>): Promise<void>;
  delete(id: UUID): Promise<void>;
  findAll(): Promise<LearningResource[]>;
  findById(id: UUID): Promise<LearningResource | null>;
  findWithFiltersAndCount(
    filters: ResourceFilters,
    pagination: ResourcePagination,
  ): Promise<PaginatedResources>;
  findSimilarTitles(q: string, limit?: number): Promise<string[]>;
}
