import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';

export function resourceRecommendation(title: string, score: number): ScoredRecommendation {
  return { resourceId: crypto.randomUUID(), title, score, why: [] };
}

export function pathStepRecommendation(title: string, score: number): ScoredRecommendation {
  return { pathId: crypto.randomUUID(), nodeId: crypto.randomUUID(), title, score, why: [] };
}
