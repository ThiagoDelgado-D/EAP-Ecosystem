import {
  createValidationSchema,
  InvalidDataError,
  optionalArray,
  uuidField,
  ValidationError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import type {
  IRecommendationContextRepository,
  LearningResourceCandidatesPort,
  LearningPathCandidatesPort,
  RecommendationSourcesPort,
} from "@recommendation/domain";
import { RecommendationContextNotFoundError } from "../errors/index.js";
import {
  mergeCandidates,
  scoreRecommendations,
  type RecommendationCandidate,
  type ScoredRecommendation,
} from "./recommendation-scorer.js";

export interface GetRecommendationsDependencies {
  recommendationContextRepository: IRecommendationContextRepository;
  learningResourceCandidatesPort: LearningResourceCandidatesPort;
  learningPathCandidatesPort: LearningPathCandidatesPort;
  recommendationSourcesPort: RecommendationSourcesPort;
  currentUser: CurrentUser;
}

export interface GetRecommendationsRequestModel {
  excludedCandidateIds?: UUID[];
}

export type GetRecommendationsResponseModel = ScoredRecommendation[];

export const MAX_EXCLUDED_CANDIDATES = 100;

const getRecommendationsSchema =
  createValidationSchema<GetRecommendationsRequestModel>({
    excludedCandidateIds: optionalArray<UUID>("Excluded candidate ids", {
      maxLength: MAX_EXCLUDED_CANDIDATES,
      itemValidator: uuidField("Excluded candidate id", { required: true }),
    }),
  });

const isExcluded = (
  candidate: RecommendationCandidate,
  excludedIds: Set<UUID>,
): boolean =>
  (candidate.resourceId !== undefined && excludedIds.has(candidate.resourceId)) ||
  (candidate.nodeId !== undefined && excludedIds.has(candidate.nodeId));

export const getRecommendations = async (
  {
    recommendationContextRepository,
    learningResourceCandidatesPort,
    learningPathCandidatesPort,
    recommendationSourcesPort,
    currentUser,
  }: GetRecommendationsDependencies,
  request: GetRecommendationsRequestModel,
): Promise<
  | GetRecommendationsResponseModel
  | RecommendationContextNotFoundError
  | InvalidDataError
> => {
  const validationResult = getRecommendationsSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.context.fields);
  }
  const excludedIds = new Set(validationResult.excludedCandidateIds ?? []);

  const context = await recommendationContextRepository.findByUserId(
    currentUser.id,
  );
  if (!context) return new RecommendationContextNotFoundError();

  const allowsPathSteps = await recommendationSourcesPort.allowsPathSteps(currentUser.id);

  const [resourceCandidates, pathCandidates] = await Promise.all([
    learningResourceCandidatesPort.findCandidates(currentUser.id),
    allowsPathSteps
      ? learningPathCandidatesPort.findActivePathCandidates(currentUser.id)
      : Promise.resolve([]),
  ]);

  const candidates = mergeCandidates(resourceCandidates, pathCandidates).filter(
    (candidate) => !isExcluded(candidate, excludedIds),
  );

  return scoreRecommendations(candidates, context);
};
