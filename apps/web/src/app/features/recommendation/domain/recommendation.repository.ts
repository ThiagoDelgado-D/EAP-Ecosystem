import type {
  RecommendationContext,
  ScoredRecommendation,
  SetRecommendationContextPayload,
} from './recommendation.model';

export abstract class RecommendationRepository {
  abstract getRecommendations(): Promise<ScoredRecommendation[]>;
  abstract getContext(): Promise<RecommendationContext | null>;
  abstract setContext(payload: SetRecommendationContextPayload): Promise<void>;
}
