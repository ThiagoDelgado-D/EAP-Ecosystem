import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import {
  NodeProgress,
  PathMode,
  PathSource,
  StubScope,
  type LearningPath,
  type LearningPathNode,
} from "@learning-resource/domain";
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

  async function seedPath(userId: UUID): Promise<LearningPath> {
    const path: LearningPath = {
      id: await crypto.generateUUID(),
      userId,
      title: "Clean Architecture with Node.js",
      description: "DDD, ports and adapters, and layered architecture in TypeScript",
      mode: PathMode.SEQUENTIAL,
      source: PathSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    learningPathRepository.paths.push(path);
    return path;
  }

  async function seedNode(pathId: UUID): Promise<LearningPathNode> {
    const node: LearningPathNode = {
      id: await crypto.generateUUID(),
      pathId,
      title: "Domain-Driven Design Fundamentals",
      stubScope: StubScope.PATH_LOCAL,
      order: 1,
      progress: NodeProgress.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    learningPathRepository.nodes.push(node);
    return node;
  }

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
    const path = await seedPath(otherUserId);
    const node = await seedNode(path.id);

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeId = await crypto.generateUUID();

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when node belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const otherPath = await seedPath(userId);
    const nodeFromOtherPath = await seedNode(otherPath.id);

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: nodeFromOtherPath.id },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should delete the node and return void", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const node = await seedNode(path.id);

    const result = await deleteLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id },
    );

    expect(result).toBeUndefined();
    expect(learningPathRepository.nodes).toHaveLength(0);
  });

  test("should cascade deletion of connected edges", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeA = await seedNode(path.id);
    const nodeB = await seedNode(path.id);
    learningPathRepository.edges.push({
      id: await crypto.generateUUID(),
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
