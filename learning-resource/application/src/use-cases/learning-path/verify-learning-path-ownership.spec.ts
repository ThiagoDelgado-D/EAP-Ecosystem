import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { seedLearningPath } from "../../mocks/factories.js";
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

  test("should return LearningPathNotFoundError when the path does not exist", async () => {
    const requestingUserId = await crypto.generateUUID();
    const nonExistentPathId = await crypto.generateUUID();

    const result = await verifyLearningPathOwnership(
      learningPathRepository,
      nonExistentPathId,
      requestingUserId,
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when the path belongs to another user", async () => {
    const requestingUserId = await crypto.generateUUID();
    const pathOwnerId = await crypto.generateUUID();
    const otherUsersPath = seedLearningPath(learningPathRepository, { userId: pathOwnerId });

    const result = await verifyLearningPathOwnership(
      learningPathRepository,
      otherUsersPath.id,
      requestingUserId,
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return the path when it exists and belongs to the user", async () => {
    const pathOwnerId = await crypto.generateUUID();
    const ownedPath = seedLearningPath(learningPathRepository, { userId: pathOwnerId });

    const result = await verifyLearningPathOwnership(
      learningPathRepository,
      ownedPath.id,
      pathOwnerId,
    );

    expect(result).toEqual(ownedPath);
  });
});
