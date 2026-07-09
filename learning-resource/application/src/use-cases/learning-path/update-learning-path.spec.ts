import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { PathMode, PathSource, type LearningPath } from "@learning-resource/domain";
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

  async function seedPath(userId: string): Promise<LearningPath> {
    const path: LearningPath = {
      id: await crypto.generateUUID(),
      userId,
      title: "Original Title",
      description: "Original description",
      mode: PathMode.SEQUENTIAL,
      source: PathSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    learningPathRepository.paths.push(path);
    return path;
  }

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId, title: "New Title" },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = await seedPath(otherUserId);

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id, title: "Hijacked" },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should update title and return updated path", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id, title: "Updated Title" },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.title).toBe("Updated Title");
    expect(result.id).toBe(path.id);
  });

  test("should update description", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id, description: "New description" },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.description).toBe("New description");
  });

  test("should return InvalidDataError when pathId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();

    const result = await updateLearningPath(
      { learningPathRepository },
      { userId, pathId: "not-a-uuid" as any, title: "X" },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
