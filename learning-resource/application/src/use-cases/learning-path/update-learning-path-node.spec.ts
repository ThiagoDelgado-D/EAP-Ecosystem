import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, isErrorResult, mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { StubScope, type LearningPath, type LearningPathNode } from "@learning-resource/domain";
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

  async function linkStubNodeToResource(
    currentUser: CurrentUser,
    path: LearningPath,
  ): Promise<{ result: LearningPathNode; learningResourceId: string }> {
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    const learningResourceId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId: path.id, nodeId: node.id, learningResourceId },
    );

    if (isErrorResult(result)) throw result;

    return { result, learningResourceId };
  }

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const pathId = await crypto.generateUUID();
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId, nodeId, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId: path.id, nodeId: node.id, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when node does not exist", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId: path.id, nodeId, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when node belongs to a different path", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const otherPath = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const nodeFromOtherPath = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId: path.id, nodeId: nodeFromOtherPath.id, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should update title without erasing other fields", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId: path.id, nodeId: node.id, title: "Docker Networking Deep Dive" },
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
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const { result, learningResourceId } = await linkStubNodeToResource(currentUser, path);

    expect(result.learningResourceId).toBe(learningResourceId);
  });

  test("should unlink a resource when learningResourceId is null", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const learningResourceId = await crypto.generateUUID();
    const linkedNode = seedLearningPathNode(learningPathRepository, {
      pathId: path.id,
      learningResourceId,
    });

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId: path.id, nodeId: linkedNode.id, learningResourceId: null },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.learningResourceId).toBeNull();
    expect(result.stubScope).toBe(StubScope.PATH_LOCAL);
  });

  test("should clear stubScope when linking a stub node to a resource", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const { result, learningResourceId } = await linkStubNodeToResource(currentUser, path);

    expect(result.learningResourceId).toBe(learningResourceId);
    expect(result.stubScope).toBeNull();
  });

  test("should return InvalidDataError when learningResourceId is not a valid UUID", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId: path.id, nodeId: node.id, learningResourceId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("should return InvalidDataError when nodeId is not a valid UUID", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const pathId = await crypto.generateUUID();

    const result = await updateLearningPathNode(
      { learningPathRepository, currentUser },
      { pathId, nodeId: "not-a-uuid" as any, title: "Docker Networking" },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
