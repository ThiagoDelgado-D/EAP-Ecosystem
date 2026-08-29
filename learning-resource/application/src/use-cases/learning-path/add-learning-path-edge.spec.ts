import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import type { LearningPath, LearningPathNode } from "@learning-resource/domain";
import { seedLearningPath, seedLearningPathNode } from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { addLearningPathEdge } from "./add-learning-path-edge.js";
import {
  DuplicateLearningPathEdgeError,
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("addLearningPathEdge", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  async function seedPathWithConnectedNodes(
    userId: UUID,
  ): Promise<{ path: LearningPath; nodeA: LearningPathNode; nodeB: LearningPathNode }> {
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );
    return { path, nodeA, nodeB };
  }

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const sourceNodeId = await crypto.generateUUID();
    const targetNodeId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId, sourceNodeId, targetNodeId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when source node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nonExistentId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nonExistentId, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when target node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nonExistentId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nonExistentId },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when source node belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const otherPath = seedLearningPath(learningPathRepository, { userId });
    const nodeFromOtherPath = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeFromOtherPath.id, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return DuplicateLearningPathEdgeError when edge already exists", async () => {
    const userId = await crypto.generateUUID();
    const { path, nodeA, nodeB } = await seedPathWithConnectedNodes(userId);

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(DuplicateLearningPathEdgeError);
  });

  test("should return InvalidDataError when source and target nodes are the same", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: node.id, targetNodeId: node.id },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("should create the edge and return it", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeA = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const nodeB = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof DuplicateLearningPathEdgeError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.pathId).toBe(path.id);
    expect(result.sourceNodeId).toBe(nodeA.id);
    expect(result.targetNodeId).toBe(nodeB.id);
    expect(learningPathRepository.edges).toHaveLength(1);
  });

  test("should allow reverse direction edge between the same two nodes", async () => {
    const userId = await crypto.generateUUID();
    const { path, nodeA, nodeB } = await seedPathWithConnectedNodes(userId);

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeB.id, targetNodeId: nodeA.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof DuplicateLearningPathEdgeError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(learningPathRepository.edges).toHaveLength(2);
  });

  test("should return InvalidDataError when sourceNodeId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const targetNodeId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId, sourceNodeId: "not-a-uuid" as any, targetNodeId },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
