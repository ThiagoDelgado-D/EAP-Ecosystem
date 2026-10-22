import {
  BaseError,
  InvalidDataError,
  mockCryptoService,
  mockCurrentUser,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  generateLearningPathNodeCandidate,
  generateLearningResourceCandidate,
  generateRecommendationContext,
  mockLearningPathCandidatesPort,
  mockLearningResourceCandidatesPort,
  mockRecommendationContextRepository,
  mockRecommendationSourcesPort,
} from "../mocks/index.js";
import { RecommendationContextNotFoundError } from "../errors/index.js";
import {
  getRecommendations,
  MAX_EXCLUDED_CANDIDATES,
} from "./get-recommendations.js";

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
  let recommendationSourcesPort: ReturnType<typeof mockRecommendationSourcesPort>;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    recommendationContextRepository = mockRecommendationContextRepository();
    learningResourceCandidatesPort = mockLearningResourceCandidatesPort();
    learningPathCandidatesPort = mockLearningPathCandidatesPort();
    recommendationSourcesPort = mockRecommendationSourcesPort();
    currentUser = await mockCurrentUser(cryptoService);
  });

  const deps = () => ({
    recommendationContextRepository,
    learningResourceCandidatesPort,
    learningPathCandidatesPort,
    recommendationSourcesPort,
    currentUser,
  });

  test("returns a not-found error when the user has no recommendation context yet", async () => {
    const result = await getRecommendations(deps(), {});

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

    const result = await getRecommendations(deps(), {});

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

    const result = await getRecommendations(deps(), {});

    expect(result).toEqual([]);
  });

  describe("when the learner can't use path steps", () => {
    beforeEach(() => {
      recommendationContextRepository.contexts.push(
        generateRecommendationContext({ userId: currentUser.id }),
      );
      recommendationSourcesPort.usersWithoutPathSteps.add(currentUser.id);
    });

    test("leaves out path steps that have no resource of their own", async () => {
      learningPathCandidatesPort.candidatesByUser[currentUser.id] = [
        generateLearningPathNodeCandidate(),
      ];

      const result = await getRecommendations(deps(), {});

      expect(result).toEqual([]);
    });

    test("still recommends a resource that is also a path step, without its path", async () => {
      const resource = generateLearningResourceCandidate();
      learningResourceCandidatesPort.candidatesByUser[currentUser.id] = [resource];
      learningPathCandidatesPort.candidatesByUser[currentUser.id] = [
        generateLearningPathNodeCandidate({ resourceId: resource.resourceId }),
      ];

      const result = await getRecommendations(deps(), {});
      if (result instanceof BaseError) throw result;

      expect(result).toHaveLength(1);
      expect(result[0].resourceId).toBe(resource.resourceId);
      expect(result[0].pathId).toBeUndefined();
    });

    test("doesn't look up path step candidates at all", async () => {
      const findActivePathCandidates = vi.spyOn(
        learningPathCandidatesPort,
        "findActivePathCandidates",
      );

      await getRecommendations(deps(), {});

      expect(findActivePathCandidates).not.toHaveBeenCalled();
    });
  });

  describe("excluded candidates", () => {
    beforeEach(() => {
      recommendationContextRepository.contexts.push(
        generateRecommendationContext({ userId: currentUser.id }),
      );
    });

    test("leaves out a resource dismissed by its id and keeps ranking the rest", async () => {
      const dismissedResource = generateLearningResourceCandidate();
      const remainingResource = generateLearningResourceCandidate();
      learningResourceCandidatesPort.candidatesByUser[currentUser.id] = [
        dismissedResource,
        remainingResource,
      ];

      const result = await getRecommendations(deps(), {
        excludedCandidateIds: [dismissedResource.resourceId],
      });

      expect(result).toEqual([
        expect.objectContaining({ resourceId: remainingResource.resourceId }),
      ]);
    });

    test("leaves out a path node without a resource when dismissed by its node id", async () => {
      const dismissedNode = generateLearningPathNodeCandidate();
      learningPathCandidatesPort.candidatesByUser[currentUser.id] = [
        dismissedNode,
      ];

      const result = await getRecommendations(deps(), {
        excludedCandidateIds: [dismissedNode.nodeId],
      });

      expect(result).toEqual([]);
    });

    test("leaves out a resource that is also the next node of a path when dismissed by either id", async () => {
      const pathResource = generateLearningResourceCandidate();
      learningResourceCandidatesPort.candidatesByUser[currentUser.id] = [
        pathResource,
      ];
      const nextNode = generateLearningPathNodeCandidate({
        resourceId: pathResource.resourceId,
      });
      learningPathCandidatesPort.candidatesByUser[currentUser.id] = [nextNode];

      const byResource = await getRecommendations(deps(), {
        excludedCandidateIds: [pathResource.resourceId],
      });
      const byNode = await getRecommendations(deps(), {
        excludedCandidateIds: [nextNode.nodeId],
      });

      expect(byResource).toEqual([]);
      expect(byNode).toEqual([]);
    });

    test("rejects an excluded id that is not a UUID", async () => {
      const result = await getRecommendations(deps(), {
        excludedCandidateIds: ["not-a-uuid" as UUID],
      });

      expect(result).toBeInstanceOf(InvalidDataError);
    });

    test("rejects more excluded ids than the allowed maximum", async () => {
      const tooManyIds = await Promise.all(
        Array.from({ length: MAX_EXCLUDED_CANDIDATES + 1 }, () =>
          cryptoService.generateUUID(),
        ),
      );

      const result = await getRecommendations(deps(), {
        excludedCandidateIds: tooManyIds,
      });

      expect(result).toBeInstanceOf(InvalidDataError);
    });
  });
});
