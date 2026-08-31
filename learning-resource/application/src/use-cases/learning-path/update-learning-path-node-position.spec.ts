import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { seedLearningPath, seedLearningPathNode } from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { updateLearningPathNodePosition } from "./update-learning-path-node-position.js";
import {
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("updateLearningPathNodePosition", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const requestingUserId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNodePosition(
      { learningPathRepository },
      { userId: requestingUserId, pathId, nodeId, x: 100, y: 200 },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const requestingUserId = await crypto.generateUUID();
    const pathOwnerId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: pathOwnerId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNodePosition(
      { learningPathRepository },
      { userId: requestingUserId, pathId: path.id, nodeId: node.id, x: 100, y: 200 },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when node does not exist", async () => {
    const pathOwnerId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: pathOwnerId });
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNodePosition(
      { learningPathRepository },
      { userId: pathOwnerId, pathId: path.id, nodeId, x: 100, y: 200 },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when node belongs to a different path", async () => {
    const pathOwnerId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: pathOwnerId });
    const otherPath = seedLearningPath(learningPathRepository, { userId: pathOwnerId });
    const nodeFromOtherPath = seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });

    const result = await updateLearningPathNodePosition(
      { learningPathRepository },
      { userId: pathOwnerId, pathId: path.id, nodeId: nodeFromOtherPath.id, x: 100, y: 200 },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return InvalidDataError when x/y are missing or non-numeric", async () => {
    const pathOwnerId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const nodeId = await crypto.generateUUID();

    const result = await updateLearningPathNodePosition(
      { learningPathRepository },
      { userId: pathOwnerId, pathId, nodeId, x: "left" as any, y: 200 },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("should update the node's x/y and leave other fields untouched", async () => {
    const pathOwnerId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: pathOwnerId });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });

    const result = await updateLearningPathNodePosition(
      { learningPathRepository },
      { userId: pathOwnerId, pathId: path.id, nodeId: node.id, x: 340.5, y: -12 },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.x).toBe(340.5);
    expect(result.y).toBe(-12);
    expect(result.title).toBe(node.title);
  });
});
