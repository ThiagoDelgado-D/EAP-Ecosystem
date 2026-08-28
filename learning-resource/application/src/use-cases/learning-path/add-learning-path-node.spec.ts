import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import {
  NodeProgress,
  PathMode,
  PathSource,
  StubScope,
  type LearningPath,
  type LearningPathNode,
} from "@learning-resource/domain";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { addLearningPathNode } from "./add-learning-path-node.js";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("addLearningPathNode", () => {
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
      title: "Go Programming Language",
      description: "From concurrency primitives to building production-grade services",
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

    const result = await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId, title: "Goroutines and Channels" },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = await seedPath(otherUserId);

    const result = await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, title: "Goroutines and Channels" },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should create a stub node with default progress and stubScope", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);

    const result = await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, title: "Goroutines and Channels" },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.title).toBe("Goroutines and Channels");
    expect(result.pathId).toBe(path.id);
    expect(result.progress).toBe(NodeProgress.PENDING);
    expect((result as LearningPathNode & { stubScope?: StubScope }).stubScope).toBe(StubScope.PATH_LOCAL);
    expect(result.learningResourceId).toBeUndefined();
  });

  test("should create a linked node when learningResourceId is provided", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const learningResourceId = await crypto.generateUUID();

    const result = await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, title: "Building REST APIs with net/http", learningResourceId },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.learningResourceId).toBe(learningResourceId);
    expect(result.stubScope).toBeUndefined();
  });

  test("should respect explicit stubScope and progress when provided", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);

    const result = await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      {
        userId,
        pathId: path.id,
        title: "Error Handling Patterns in Go",
        stubScope: StubScope.CATALOG,
        progress: NodeProgress.IN_PROGRESS,
        order: 1,
      },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect((result as LearningPathNode & { stubScope?: StubScope }).stubScope).toBe(StubScope.CATALOG);
    expect(result.progress).toBe(NodeProgress.IN_PROGRESS);
    expect(result.order).toBe(1);
  });

  test("should persist the node in the repository", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);

    await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, title: "Interfaces and Composition" },
    );

    expect(learningPathRepository.nodes).toHaveLength(1);
    expect(learningPathRepository.nodes[0]?.title).toBe("Interfaces and Composition");
  });

  test("should return InvalidDataError when pathId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();

    const result = await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: "not-a-uuid" as any, title: "Goroutines and Channels" },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("should return InvalidDataError when title is missing", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await addLearningPathNode(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId, title: "" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
