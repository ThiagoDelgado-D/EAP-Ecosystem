import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { seedLearningPath } from "../../mocks/factories.js";
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
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await getLearningPath(
      { learningPathRepository },
      { userId, pathId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });

    const result = await getLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return path with nodes and edges when user owns it", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });

    const result = await getLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.path.id).toBe(path.id);
    expect(result.path.title).toBe(path.title);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  test("should return InvalidDataError when pathId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();

    const result = await getLearningPath(
      { learningPathRepository },
      { userId, pathId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
