import type { UseCaseErrors } from "domain-lib";
import { addResource } from "./use-cases/learning-resource/add-resource.js";
import { deleteResource } from "./use-cases/learning-resource/delete-resource.js";
import { updateResource } from "./use-cases/learning-resource/edit-resource.js";
import { GetResourceById } from "./use-cases/learning-resource/get-resource-by-id.js";
import { getResourcesByFilter } from "./use-cases/learning-resource/get-resources-by-filter.js";
import { listFormattedResourcesLearning } from "./use-cases/learning-resource/list-resource.js";
import { toggleResourceDifficulty } from "./use-cases/toggles/toggle-resource-difficulty.js";
import { toggleResourceEnergy } from "./use-cases/toggles/toggle-resource-energy.js";
import { toggleStatus } from "./use-cases/toggles/toggle-resource-status.js";

export const learningResourceUseCaseMap = {
  addResource,
  deleteResource,
  updateResource,
  GetResourceById,
  getResourcesByFilter,
  listFormattedResourcesLearning,
  toggleResourceDifficulty,
  toggleResourceEnergy,
  toggleStatus,
} as const;

export type LearningResourceUseCaseMap = typeof learningResourceUseCaseMap;

export type LearningResourceDomainError =
  UseCaseErrors<LearningResourceUseCaseMap>;
