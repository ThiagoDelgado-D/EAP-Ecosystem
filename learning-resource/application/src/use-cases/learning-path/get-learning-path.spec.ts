import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, mockCurrentUser } from "domain-lib";
import { seedLearningPath, seedLearningPathNode } from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { getLearningPath } from "./get-learning-path.js";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("getLearningPath", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const pathId = await crypto.generateUUID();

    const result = await getLearningPath(
      { learningPathRepository, currentUser },
      { pathId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });

    const result = await getLearningPath(
      { learningPathRepository, currentUser },
      { pathId: path.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return path with nodes and edges when user owns it", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });

    const result = await getLearningPath(
      { learningPathRepository, currentUser },
      { pathId: path.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.path.id).toBe(path.id);
    expect(result.path.title).toBe(path.title);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.path.stats).toEqual({ total: 0, done: 0, linked: 0 });
  });

  test("should populate stats from the path's own nodes", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    seedLearningPathNode(learningPathRepository, {
      pathId: path.id,
      progress: "done",
      learningResourceId: await crypto.generateUUID(),
    });
    seedLearningPathNode(learningPathRepository, { pathId: path.id, progress: "pending" });

    const result = await getLearningPath(
      { learningPathRepository, currentUser },
      { pathId: path.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.path.stats).toEqual({ total: 2, done: 1, linked: 1 });
  });

  test("should return InvalidDataError when pathId is not a valid UUID", async () => {
    const currentUser = await mockCurrentUser(crypto);

    const result = await getLearningPath(
      { learningPathRepository, currentUser },
      { pathId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
