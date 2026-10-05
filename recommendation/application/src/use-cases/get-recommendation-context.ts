import type { CurrentUser } from "domain-lib";
import type {
  IRecommendationContextRepository,
  RecommendationContext,
} from "@recommendation/domain";
import { RecommendationContextNotFoundError } from "../errors/index.js";

export interface GetRecommendationContextDependencies {
  recommendationContextRepository: IRecommendationContextRepository;
  currentUser: CurrentUser;
}

export type GetRecommendationContextResponseModel = RecommendationContext;

export const getRecommendationContext = async ({
  recommendationContextRepository,
  currentUser,
}: GetRecommendationContextDependencies): Promise<
  GetRecommendationContextResponseModel | RecommendationContextNotFoundError
> => {
  const context = await recommendationContextRepository.findByUserId(
    currentUser.id,
  );
  if (!context) return new RecommendationContextNotFoundError();

  return context;
};
