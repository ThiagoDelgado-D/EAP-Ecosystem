import type { ScoredRecommendation, SetRecommendationContextPayload } from './recommendation.model';

export abstract class RecommendationRepository {
  abstract getRecommendations(): Promise<ScoredRecommendation[]>;
  abstract setContext(payload: SetRecommendationContextPayload): Promise<void>;
}
