import type { UUID } from "domain-lib";
import type { RecommendationSourcesPort } from "@recommendation/domain";

export interface MockedRecommendationSourcesPort extends RecommendationSourcesPort {
  usersWithoutPathSteps: Set<UUID>;
  reset(): void;
}

export function mockRecommendationSourcesPort(): MockedRecommendationSourcesPort {
  return {
    usersWithoutPathSteps: new Set<UUID>(),

    allowsPathSteps(userId: UUID): Promise<boolean> {
      return Promise.resolve(!this.usersWithoutPathSteps.has(userId));
    },

    reset(): void {
      this.usersWithoutPathSteps.clear();
    },
  };
}
