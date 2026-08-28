import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { StubScope } from "@learning-resource/domain";
import { seedLearningPath, seedLearningPathNode } from "../../mocks/factories.js";
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
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when node belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const otherPath = seedLearningPath(learningPathRepository, { userId });
    const nodeFromOtherPath = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: nodeFromOtherPath.id, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should update title without erasing other fields", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

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
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });
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
    const path = seedLearningPath(learningPathRepository, { userId });
    const learningResourceId = await crypto.generateUUID();
    const linkedNode = seedLearningPathNode(learningPathRepository, {
      pathId: path.id,
      learningResourceId,
    });

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: linkedNode.id, learningResourceId: null },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.learningResourceId).toBeNull();
    expect(result.stubScope).toBe(StubScope.PATH_LOCAL);
  });

  test("should clear stubScope when linking a stub node to a resource", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });
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
    expect(result.stubScope).toBeNull();
  });

  test("should return InvalidDataError when learningResourceId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNode(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, learningResourceId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
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
