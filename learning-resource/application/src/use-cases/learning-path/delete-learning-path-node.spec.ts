import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import {
  seedLearningPath,
  seedLearningPathEdge,
  seedLearningPathNode,
} from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { deleteLearningPathNode } from "./delete-learning-path-node.js";
import {
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("deleteLearningPathNode", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const nodeId = await crypto.generateUUID();

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId, nodeId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeId = await crypto.generateUUID();

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when node belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const otherPath = seedLearningPath(learningPathRepository, { userId });
    const nodeFromOtherPath = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: nodeFromOtherPath.id },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should delete the node and return void", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id },
    );

    expect(result).toBeUndefined();
    expect(learningPathRepository.nodes).toHaveLength(0);
  });

  test("should cascade deletion of connected edges", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    seedLearningPathEdge(learningPathRepository, {
      pathId: path.id,
      sourceNodeId: nodeA.id,
      targetNodeId: nodeB.id,
    });

    await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: nodeA.id },
    );

    expect(learningPathRepository.nodes).toHaveLength(1);
    expect(learningPathRepository.edges).toHaveLength(0);
  });

  test("should return InvalidDataError when nodeId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId, nodeId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
