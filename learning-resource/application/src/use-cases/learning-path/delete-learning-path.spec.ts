import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, mockCurrentUser } from "domain-lib";
import {
  seedLearningPath,
  seedLearningPathEdge,
  seedLearningPathNode,
} from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { deleteLearningPath } from "./delete-learning-path.js";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("deleteLearningPath", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const pathId = await crypto.generateUUID();

    const result = await deleteLearningPath(
      { learningPathRepository, currentUser },
      { pathId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const otherUserId = await crypto.generateUUID();
    const path = seedLearningPath(learningPathRepository, { userId: otherUserId });

    const result = await deleteLearningPath(
      { learningPathRepository, currentUser },
      { pathId: path.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should delete the path and return void", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });

    const result = await deleteLearningPath(
      { learningPathRepository, currentUser },
      { pathId: path.id },
    );

    expect(result).toBeUndefined();
    expect(learningPathRepository.paths).toHaveLength(0);
  });

  test("should also remove associated nodes and edges on delete", async () => {
    const currentUser = await mockCurrentUser(crypto);
    const path = seedLearningPath(learningPathRepository, { userId: currentUser.id });
    const node = seedLearningPathNode(learningPathRepository, { pathId: path.id });
    seedLearningPathEdge(learningPathRepository, {
      pathId: path.id,
      sourceNodeId: node.id,
    });

    const result = await deleteLearningPath(
      { learningPathRepository, currentUser },
      { pathId: path.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(learningPathRepository.nodes).toHaveLength(0);
    expect(learningPathRepository.edges).toHaveLength(0);
  });

  test("should return InvalidDataError when pathId is not a valid UUID", async () => {
    const currentUser = await mockCurrentUser(crypto);

    const result = await deleteLearningPath(
      { learningPathRepository, currentUser },
      { pathId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
