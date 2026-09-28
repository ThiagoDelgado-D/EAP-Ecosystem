import { mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import {
  generateLearningPathNodeCandidate,
  generateLearningResourceCandidate,
  generateRecommendationContext,
  mockLearningPathCandidatesPort,
  mockLearningResourceCandidatesPort,
  mockRecommendationContextRepository,
} from "../mocks/index.js";
import { RecommendationContextNotFoundError } from "../errors/index.js";
import { getRecommendations } from "./get-recommendations.js";

describe("getRecommendations", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let recommendationContextRepository: ReturnType<
    typeof mockRecommendationContextRepository
  >;
  let learningResourceCandidatesPort: ReturnType<
    typeof mockLearningResourceCandidatesPort
  >;
  let learningPathCandidatesPort: ReturnType<
    typeof mockLearningPathCandidatesPort
  >;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    recommendationContextRepository = mockRecommendationContextRepository();
    learningResourceCandidatesPort = mockLearningResourceCandidatesPort();
    learningPathCandidatesPort = mockLearningPathCandidatesPort();
    currentUser = await mockCurrentUser(cryptoService);
  });

  const deps = () => ({
    recommendationContextRepository,
    learningResourceCandidatesPort,
    learningPathCandidatesPort,
    currentUser,
  });

  test("returns a not-found error when the user has no recommendation context yet", async () => {
    const result = await getRecommendations(deps());

    expect(result).toBeInstanceOf(RecommendationContextNotFoundError);
  });

  test("scores candidates from both the resource and the learning-path ports", async () => {
    const context = generateRecommendationContext({ userId: currentUser.id });
    recommendationContextRepository.contexts.push(context);

    const resource = generateLearningResourceCandidate({
      energyLevel: context.energyLevel,
    });
    learningResourceCandidatesPort.candidatesByUser[currentUser.id] = [
      resource,
    ];

    const node = generateLearningPathNodeCandidate({
      resourceId: resource.resourceId,
    });
    learningPathCandidatesPort.candidatesByUser[currentUser.id] = [node];

    const result = await getRecommendations(deps());

    expect(result).toEqual([
      expect.objectContaining({
        resourceId: resource.resourceId,
        pathId: node.pathId,
      }),
    ]);
  });

  test("does not leak another user's candidates into the scored list", async () => {
    const context = generateRecommendationContext({ userId: currentUser.id });
    recommendationContextRepository.contexts.push(context);

    const otherUserId = await cryptoService.generateUUID();
    learningResourceCandidatesPort.candidatesByUser[otherUserId] = [
      generateLearningResourceCandidate(),
    ];

    const result = await getRecommendations(deps());

    expect(result).toEqual([]);
  });
});
