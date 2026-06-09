import type {
  ILearningResourceRepository,
  PaginatedResources,
  ResourceFilters,
} from "@learning-resource/domain";

export interface GetResourcesWithPaginationDeps {
  learningResourceRepository: ILearningResourceRepository;
}

export interface GetResourcesWithPaginationRequestModel {
  filters?: ResourceFilters;
  page?: number;
  pageSize?: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const getResourcesByFilter = async (
  { learningResourceRepository }: GetResourcesWithPaginationDeps,
  request: GetResourcesWithPaginationRequestModel = {},
): Promise<PaginatedResources> => {
  const page = Math.max(1, request.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, request.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const filters: ResourceFilters = request.filters ?? {};

  return learningResourceRepository.findWithFiltersAndCount(filters, {
    page,
    pageSize,
  });
};
