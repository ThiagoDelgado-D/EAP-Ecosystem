import type { UUID } from "domain-lib";
import type { RecommendationContext } from "../entities/recommendation-context.js";

export interface IRecommendationContextRepository {
  findByUserId(userId: UUID): Promise<RecommendationContext | null>;
  upsert(context: RecommendationContext): Promise<RecommendationContext>;
}
