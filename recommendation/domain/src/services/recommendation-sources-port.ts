import type { UUID } from "domain-lib";

export interface RecommendationSourcesPort {
  allowsPathSteps(userId: UUID): Promise<boolean>;
}
