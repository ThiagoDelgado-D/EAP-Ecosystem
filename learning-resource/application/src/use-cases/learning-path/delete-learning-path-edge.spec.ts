import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, mockCurrentUser } from "domain-lib";
import {
  seedLearningPath,
  seedLearningPathEdge,
  seedLearningPathNode,
} from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { deleteLearningPathEdge } from "./delete-learning-path-edge.js";
import {
  LearningPathEdgeNotFoundError,
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("deleteLearningPathEdge", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const pathId = await crypto.generateUUID();
    const edgeId = await crypto.generateUUID();

    const result = await deleteLearningPathEdge(
      { learningPathRepository, currentUser },
      { pathId, edgeId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const edge = seedLearningPathEdge(learningPathRepository, {
      pathId: path.id,
      sourceNodeId: nodeA.id,
      targetNodeId: nodeB.id,
    });

    const result = await deleteLearningPathEdge(
      { learningPathRepository, currentUser },
      { pathId: path.id, edgeId: edge.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathEdgeNotFoundError when edge does not exist", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const edgeId = await crypto.generateUUID();

    const result = await deleteLearningPathEdge(
      { learningPathRepository, currentUser },
      { pathId: path.id, edgeId },
    );

    expect(result).toBeInstanceOf(LearningPathEdgeNotFoundError);
  });

  test("should return LearningPathEdgeNotFoundError when edge belongs to a different path", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const otherPath = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });
    const edgeFromOtherPath = seedLearningPathEdge(learningPathRepository, {
      pathId: otherPath.id,
      sourceNodeId: nodeA.id,
      targetNodeId: nodeB.id,
    });

    const result = await deleteLearningPathEdge(
      { learningPathRepository, currentUser },
      { pathId: path.id, edgeId: edgeFromOtherPath.id },
    );

    expect(result).toBeInstanceOf(LearningPathEdgeNotFoundError);
  });

  test("should delete the edge and return void", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const edge = seedLearningPathEdge(learningPathRepository, {
      pathId: path.id,
      sourceNodeId: nodeA.id,
      targetNodeId: nodeB.id,
    });

    const result = await deleteLearningPathEdge(
      { learningPathRepository, currentUser },
      { pathId: path.id, edgeId: edge.id },
    );

    expect(result).toBeUndefined();
    expect(learningPathRepository.edges).toHaveLength(0);
  });

  test("should only delete the targeted edge leaving others intact", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeC = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const edgeAB = seedLearningPathEdge(learningPathRepository, {
      pathId: path.id,
      sourceNodeId: nodeA.id,
      targetNodeId: nodeB.id,
    });
    seedLearningPathEdge(learningPathRepository, {
      pathId: path.id,
      sourceNodeId: nodeB.id,
      targetNodeId: nodeC.id,
    });

    await deleteLearningPathEdge(
      { learningPathRepository, currentUser },
      { pathId: path.id, edgeId: edgeAB.id },
    );

    expect(learningPathRepository.edges).toHaveLength(1);
    expect(learningPathRepository.edges[0]?.sourceNodeId).toBe(nodeB.id);
  });

  test("should return InvalidDataError when edgeId is not a valid UUID", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const pathId = await crypto.generateUUID();

    const result = await deleteLearningPathEdge(
      { learningPathRepository, currentUser },
      { pathId, edgeId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
