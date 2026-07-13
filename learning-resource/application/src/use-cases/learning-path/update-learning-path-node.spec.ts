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
import { updateLearningPathNode } from "./update-learning-path-node.js";
import {
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("updateLearningPathNode", () => {
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
      title: "Docker and Kubernetes Fundamentals",
      description: "From containers to production-grade orchestration with Kubernetes",
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
      title: "Introduction to Docker",
      description: "Images, containers, and the Docker daemon",
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

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId, nodeId, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = await seedPath(otherUserId);
    const node = await seedNode(path.id);

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when node belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const otherPath = await seedPath(userId);
    const nodeFromOtherPath = await seedNode(otherPath.id);

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: nodeFromOtherPath.id, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should update title without erasing other fields", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const node = await seedNode(path.id);

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, title: "Docker Networking Deep Dive" },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.title).toBe("Docker Networking Deep Dive");
    expect(result.description).toBe(node.description);
    expect(result.order).toBe(node.order);
  });

  test("should link a resource by setting learningResourceId", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const node = await seedNode(path.id);
    const learningResourceId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, learningResourceId },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.learningResourceId).toBe(learningResourceId);
  });

  test("should unlink a resource when learningResourceId is null", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const learningResourceId = await crypto.generateUUID();
    const linkedNode: LearningPathNode = {
      id: await crypto.generateUUID(),
      pathId: path.id,
      title: "Writing Dockerfiles",
      learningResourceId,
      order: 2,
      progress: NodeProgress.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    learningPathRepository.nodes.push(linkedNode);

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: linkedNode.id, learningResourceId: null },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.learningResourceId).toBeNull();
  });

  test("should return InvalidDataError when nodeId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId, nodeId: "not-a-uuid" as any, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
