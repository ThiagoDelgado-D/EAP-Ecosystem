import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import {
  PathMode,
  PathSource,
  type LearningPath,
} from "@learning-resource/domain";
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

  async function seedPath(userId: UUID): Promise<LearningPath> {
    const path: LearningPath = {
      id: await crypto.generateUUID(),
      userId,
      title: "PostgreSQL Performance Tuning",
      description: "Indexing strategies, query optimization, and EXPLAIN ANALYZE",
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

    const result = await deleteLearningPath(
      { learningPathRepository },
      { userId, pathId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = await seedPath(otherUserId);

    const result = await deleteLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should delete the path and return void", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);

    const result = await deleteLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id },
    );

    expect(result).toBeUndefined();
    expect(learningPathRepository.paths).toHaveLength(0);
  });

  test("should also remove associated nodes and edges on delete", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeId = await crypto.generateUUID();

    learningPathRepository.nodes.push({
      id: nodeId,
      pathId: path.id,
      title: "Understanding EXPLAIN ANALYZE output",
      progress: "pending",
      stubScope: "path-local",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    learningPathRepository.edges.push({
      id: await crypto.generateUUID(),
      pathId: path.id,
      sourceNodeId: nodeId,
      targetNodeId: await crypto.generateUUID(),
    });

    const result = await deleteLearningPath(
      { learningPathRepository },
      { userId, pathId: path.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(learningPathRepository.nodes).toHaveLength(0);
    expect(learningPathRepository.edges).toHaveLength(0);
  });

  test("should return InvalidDataError when pathId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();

    const result = await deleteLearningPath(
      { learningPathRepository },
      { userId, pathId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
