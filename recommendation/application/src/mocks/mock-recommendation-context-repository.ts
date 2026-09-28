import type { UUID } from "domain-lib";
import type {
  IRecommendationContextRepository,
  RecommendationContext,
} from "@recommendation/domain";

export interface MockedRecommendationContextRepository
  extends IRecommendationContextRepository {
  contexts: RecommendationContext[];
  reset(): void;
}

export function mockRecommendationContextRepository(
  initial: RecommendationContext[] = [],
): MockedRecommendationContextRepository {
  return {
    contexts: [...initial],

    async findByUserId(userId: UUID): Promise<RecommendationContext | null> {
      return this.contexts.find((c) => c.userId === userId) ?? null;
    },

    async save(
      context: RecommendationContext,
    ): Promise<RecommendationContext> {
      const index = this.contexts.findIndex(
        (c) => c.userId === context.userId,
      );
      if (index === -1) {
        this.contexts.push(context);
      } else {
        this.contexts[index] = context;
      }
      return context;
    },

    reset(): void {
      this.contexts = [];
    },
  };
}
