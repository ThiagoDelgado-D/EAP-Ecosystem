import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import type {
  RecommendationContext,
  ScoredRecommendation,
  SetRecommendationContextPayload,
} from '@features/recommendation/domain/recommendation.model';

export interface MockedRecommendationRepository extends RecommendationRepository {
  context: RecommendationContext | null;
  recommendations: ScoredRecommendation[];
  savedContexts: SetRecommendationContextPayload[];
  excludedCandidateIds: string[];
}

export function mockRecommendationRepository(
  initial: { context?: RecommendationContext | null; recommendations?: ScoredRecommendation[] } = {},
): MockedRecommendationRepository {
  return {
    context: initial.context ?? null,
    recommendations: [...(initial.recommendations ?? [])],
    savedContexts: [],
    excludedCandidateIds: [],

    getRecommendations(excludedCandidateIds: string[] = []): Promise<ScoredRecommendation[]> {
      this.excludedCandidateIds = excludedCandidateIds;
      if (!this.context) return Promise.resolve([]);
      const excluded = new Set(excludedCandidateIds);
      return Promise.resolve(
        this.recommendations.filter(
          (rec) => !excluded.has(rec.resourceId ?? '') && !excluded.has(rec.nodeId ?? ''),
        ),
      );
    },

    getContext(): Promise<RecommendationContext | null> {
      return Promise.resolve(this.context);
    },

    setContext(payload: SetRecommendationContextPayload): Promise<void> {
      this.savedContexts.push(payload);
      this.context = {
        energyLevel: payload.energyLevel,
        availableMinutes: payload.availableMinutes,
        mentalState: payload.mentalState,
      };
      return Promise.resolve();
    },
  };
}
