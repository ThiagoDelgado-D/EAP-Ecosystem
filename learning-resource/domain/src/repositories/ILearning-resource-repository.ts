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

export const ResourceSortField = {
  CREATED_AT: "createdAt",
  TITLE: "title",
  DIFFICULTY: "difficulty",
  ENERGY_LEVEL: "energyLevel",
  ESTIMATED_DURATION_MINUTES: "estimatedDurationMinutes",
} as const;

export type ResourceSortField =
  (typeof ResourceSortField)[keyof typeof ResourceSortField];

export const SortDirection = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export interface ResourceSort {
  field: ResourceSortField;
  direction: SortDirection;
}

export const DEFAULT_RESOURCE_SORT: ResourceSort = {
  field: ResourceSortField.CREATED_AT,
  direction: SortDirection.DESC,
};

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
  findAllByUserId(userId: UUID): Promise<LearningResource[]>;
  findById(id: UUID): Promise<LearningResource | null>;
  findWithFiltersAndCount(
    userId: UUID,
    filters: ResourceFilters,
    pagination: ResourcePagination,
    sort: ResourceSort,
  ): Promise<PaginatedResources>;
  findSimilarTitles(userId: UUID, q: string, limit?: number): Promise<string[]>;
}
