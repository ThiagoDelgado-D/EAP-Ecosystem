import type {
  ILearningResourceRepository,
  LearningResource,
  ResourceFilters,
} from "@learning-resource/domain";
import type { CurrentUser, UUID } from "domain-lib";

export interface GetResourcesWithPaginationDeps {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
}

export interface GetResourcesWithPaginationRequestModel {
  filters?: ResourceFilters;
  page?: number;
  pageSize?: number;
}

export interface ResourceListItemResponseModel
  extends Omit<LearningResource, "id" | "userId" | "estimatedDuration"> {
  resourceId: UUID;
  estimatedDurationMinutes: number;
}

export interface PaginatedResourcesResponseModel {
  resources: ResourceListItemResponseModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const toListItem = (resource: LearningResource): ResourceListItemResponseModel => ({
  resourceId: resource.id,
  title: resource.title,
  url: resource.url,
  imageUrl: resource.imageUrl,
  typeId: resource.typeId,
  topicIds: resource.topicIds,
  difficulty: resource.difficulty,
  estimatedDurationMinutes: resource.estimatedDuration.value,
  energyLevel: resource.energyLevel,
  mentalState: resource.mentalState,
  status: resource.status,
  lastViewed: resource.lastViewed,
  notes: resource.notes,
  createdAt: resource.createdAt,
  updatedAt: resource.updatedAt,
});

export const getResourcesByFilter = async (
  { learningResourceRepository, currentUser }: GetResourcesWithPaginationDeps,
  request: GetResourcesWithPaginationRequestModel = {},
): Promise<PaginatedResourcesResponseModel> => {
  const page = Math.max(1, request.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, request.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const filters: ResourceFilters = request.filters ?? {};

  const result = await learningResourceRepository.findWithFiltersAndCount(
    currentUser.id,
    filters,
    { page, pageSize },
  );

  return {
    resources: result.resources.map(toListItem),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  };
};
