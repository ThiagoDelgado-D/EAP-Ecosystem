import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, type UUID } from "domain-lib";
import { PathMode, PathSource, type LearningPath } from "@learning-resource/domain";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { verifyLearningPathOwnership } from "./verify-learning-path-ownership.js";
import { LearningPathForbiddenError, LearningPathNotFoundError } from "../../errors/learning-path-errors.js";

describe("verifyLearningPathOwnership", () => {
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

  test("should return LearningPathNotFoundError when the path does not exist", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await verifyLearningPathOwnership(learningPathRepository, pathId, userId);

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when the path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = await seedPath(otherUserId);

    const result = await verifyLearningPathOwnership(learningPathRepository, path.id, userId);

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return the path when it exists and belongs to the user", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);

    const result = await verifyLearningPathOwnership(learningPathRepository, path.id, userId);

    expect(result).toEqual(path);
  });
});
