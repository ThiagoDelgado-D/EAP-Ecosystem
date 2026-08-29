import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { NodeProgress } from "@learning-resource/domain";
import { seedLearningPath, seedLearningPathNode } from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { updateLearningPathNodeProgress } from "./update-learning-path-node-progress.js";
import {
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("updateLearningPathNodeProgress", () => {
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

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId, nodeId, progress: NodeProgress.DONE },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, progress: NodeProgress.DONE },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId, progress: NodeProgress.DONE },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when node belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const otherPath = seedLearningPath(learningPathRepository, { userId });
    const nodeFromOtherPath = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: nodeFromOtherPath.id, progress: NodeProgress.DONE },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should transition progress from pending to in_progress", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, {
      pathId: path.id,
      progress: NodeProgress.PENDING,
    });

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, progress: NodeProgress.IN_PROGRESS },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.progress).toBe(NodeProgress.IN_PROGRESS);
  });

  test("should transition progress from in_progress to done", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, {
      pathId: path.id,
      progress: NodeProgress.IN_PROGRESS,
    });

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, progress: NodeProgress.DONE },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.progress).toBe(NodeProgress.DONE);
  });

  test("should not modify other node fields when updating progress", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId: path.id, nodeId: node.id, progress: NodeProgress.DONE },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.title).toBe(node.title);
    expect(result.order).toBe(node.order);
  });

  test("should return InvalidDataError when progress value is invalid", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNodeProgress(
      { learningPathRepository },
      { userId, pathId, nodeId, progress: "completed" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
