import type { UseCaseErrors } from "domain-lib";
import { getRecommendations } from "./use-cases/get-recommendations.js";

export const recommendationUseCaseMap = {
  getRecommendations,
} as const;

export type RecommendationUseCaseMap = typeof recommendationUseCaseMap;

export type RecommendationDomainError = UseCaseErrors<RecommendationUseCaseMap>;
