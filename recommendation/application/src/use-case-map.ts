import type { UseCaseErrors } from "domain-lib";
import { getRecommendations } from "./use-cases/get-recommendations.js";
import { setRecommendationContext } from "./use-cases/set-recommendation-context.js";

export const recommendationUseCaseMap = {
  getRecommendations,
  setRecommendationContext,
} as const;

export type RecommendationUseCaseMap = typeof recommendationUseCaseMap;

export type RecommendationDomainError = UseCaseErrors<RecommendationUseCaseMap>;
