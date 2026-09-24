import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockCurrentUser } from "domain-lib";
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
    const requestingUser = await mockCurrentUser(crypto);
    const nonExistentPathId = await crypto.generateUUID();

    const result = await verifyLearningPathOwnership(
      learningPathRepository,
      nonExistentPathId,
      requestingUser,
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when the path belongs to another user", async () => {
    const requestingUser = await mockCurrentUser(crypto);
    const pathOwnerId = await crypto.generateUUID();
    const otherUsersPath = seedLearningPath(learningPathRepository, { userId: pathOwnerId });

    const result = await verifyLearningPathOwnership(
      learningPathRepository,
      otherUsersPath.id,
      requestingUser,
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return the path when it exists and belongs to the user", async () => {
    const pathOwner = await mockCurrentUser(crypto);
    const ownedPath = seedLearningPath(learningPathRepository, { userId: pathOwner.id });

    const result = await verifyLearningPathOwnership(
      learningPathRepository,
      ownedPath.id,
      pathOwner,
    );

    expect(result).toEqual(ownedPath);
  });
});
