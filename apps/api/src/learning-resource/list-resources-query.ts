import {
  SortDirection,
  type ResourceSort,
  type ResourceSortField,
} from "@learning-resource/domain";

const DESCENDING_PREFIX = "-";

export const parseSort = (sort?: string): ResourceSort | undefined => {
  if (!sort) return undefined;
  if (sort.startsWith(DESCENDING_PREFIX)) {
    return {
      field: sort.slice(DESCENDING_PREFIX.length) as ResourceSortField,
      direction: SortDirection.DESC,
    };
  }
  return { field: sort as ResourceSortField, direction: SortDirection.ASC };
};

export const toArray = (value: string | string[]): string[] => {
  if (Array.isArray(value)) return value;
  return [value];
};
