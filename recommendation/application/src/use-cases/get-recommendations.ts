import type { CurrentUser } from "domain-lib";
import type {
  IRecommendationContextRepository,
  LearningResourceCandidatesPort,
  LearningPathCandidatesPort,
} from "@recommendation/domain";
import { RecommendationContextNotFoundError } from "../errors/index.js";
import {
  mergeCandidates,
  scoreRecommendations,
  type ScoredRecommendation,
} from "./recommendation-scorer.js";

export interface GetRecommendationsDependencies {
  recommendationContextRepository: IRecommendationContextRepository;
  learningResourceCandidatesPort: LearningResourceCandidatesPort;
  learningPathCandidatesPort: LearningPathCandidatesPort;
  currentUser: CurrentUser;
}

export type GetRecommendationsResponseModel = ScoredRecommendation[];

export const getRecommendations = async ({
  recommendationContextRepository,
  learningResourceCandidatesPort,
  learningPathCandidatesPort,
  currentUser,
}: GetRecommendationsDependencies): Promise<
  GetRecommendationsResponseModel | RecommendationContextNotFoundError
> => {
  const context = await recommendationContextRepository.findByUserId(
    currentUser.id,
  );
  if (!context) return new RecommendationContextNotFoundError();

  const [resourceCandidates, pathCandidates] = await Promise.all([
    learningResourceCandidatesPort.findCandidates(currentUser.id),
    learningPathCandidatesPort.findActivePathCandidates(currentUser.id),
  ]);

  const candidates = mergeCandidates(resourceCandidates, pathCandidates);

  return scoreRecommendations(candidates, context);
};
