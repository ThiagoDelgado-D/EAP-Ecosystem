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
}

export function mockRecommendationRepository(
  initial: { context?: RecommendationContext | null; recommendations?: ScoredRecommendation[] } = {},
): MockedRecommendationRepository {
  return {
    context: initial.context ?? null,
    recommendations: [...(initial.recommendations ?? [])],
    savedContexts: [],

    async getRecommendations(): Promise<ScoredRecommendation[]> {
      return this.context ? this.recommendations : [];
    },

    async getContext(): Promise<RecommendationContext | null> {
      return this.context;
    },

    async setContext(payload: SetRecommendationContextPayload): Promise<void> {
      this.savedContexts.push(payload);
      this.context = {
        energyLevel: payload.energyLevel,
        availableMinutes: payload.availableMinutes,
        mentalState: payload.mentalState,
      };
    },
  };
}
