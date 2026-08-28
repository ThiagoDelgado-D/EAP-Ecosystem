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
import { toggleMentalState } from "./use-cases/toggles/toggle-mental-state.js";
import { createLearningPath } from "./use-cases/learning-path/create-learning-path.js";
import { listLearningPaths } from "./use-cases/learning-path/list-learning-paths.js";
import { getLearningPath } from "./use-cases/learning-path/get-learning-path.js";
import { updateLearningPath } from "./use-cases/learning-path/update-learning-path.js";
import { deleteLearningPath } from "./use-cases/learning-path/delete-learning-path.js";
import { addLearningPathNode } from "./use-cases/learning-path/add-learning-path-node.js";
import { deleteLearningPathNode } from "./use-cases/learning-path/delete-learning-path-node.js";
import { updateLearningPathNode } from "./use-cases/learning-path/update-learning-path-node.js";
import { updateLearningPathNodeProgress } from "./use-cases/learning-path/update-learning-path-node-progress.js";
import { addLearningPathEdge } from "./use-cases/learning-path/add-learning-path-edge.js";
import { deleteLearningPathEdge } from "./use-cases/learning-path/delete-learning-path-edge.js";

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
  toggleMentalState,
} as const;

export type LearningResourceUseCaseMap = typeof learningResourceUseCaseMap;

export type LearningResourceDomainError =
  UseCaseErrors<LearningResourceUseCaseMap>;

export const learningPathUseCaseMap = {
  createLearningPath,
  listLearningPaths,
  getLearningPath,
  updateLearningPath,
  deleteLearningPath,
} as const;

export type LearningPathUseCaseMap = typeof learningPathUseCaseMap;

export type LearningPathDomainError = UseCaseErrors<LearningPathUseCaseMap>;

export const learningPathNodeUseCaseMap = {
  addLearningPathNode,
  deleteLearningPathNode,
  updateLearningPathNode,
  updateLearningPathNodeProgress,
} as const;

export type LearningPathNodeUseCaseMap = typeof learningPathNodeUseCaseMap;

export type LearningPathNodeDomainError =
  UseCaseErrors<LearningPathNodeUseCaseMap>;

export const learningPathEdgeUseCaseMap = {
  addLearningPathEdge,
  deleteLearningPathEdge,
} as const;

export type LearningPathEdgeUseCaseMap = typeof learningPathEdgeUseCaseMap;

export type LearningPathEdgeDomainError =
  UseCaseErrors<LearningPathEdgeUseCaseMap>;
