import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { seedLearningPath } from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { updateLearningPath } from "./update-learning-path.js";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("updateLearningPath", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId, title: "Go Programming Language" },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id, title: "Go Programming Language" },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should update title and return updated path", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id, title: "Rust for Systems Programming" },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.title).toBe("Rust for Systems Programming");
    expect(result.id).toBe(path.id);
  });

  test("should update description without erasing title", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });

    const result = await updateLearningPath(
      { learningPathRepository },
      {
        userId,
        pathId: path.id,
        description: "Advanced Rust: async runtimes, macros, and unsafe code",
      },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.description).toBe(
      "Advanced Rust: async runtimes, macros, and unsafe code",
    );
    expect(result.title).toBe(path.title);
  });

  test("should update title without erasing description", async () => {
    const userId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId });

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id, title: "Rust for Systems Programming" },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.title).toBe("Rust for Systems Programming");
    expect(result.description).toBe(path.description);
  });

  test("should return InvalidDataError when pathId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();

    const result = await updateLearningPath(
      { learningPathRepository },
      {
        userId,
        pathId: "not-a-uuid" as any,
        title: "Rust for Systems Programming",
      },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
