import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { PathMode, PathSource } from "@learning-resource/domain";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { createLearningPath } from "./create-learning-path.js";

describe("createLearningPath", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should create a learning path and return it", async () => {
    const userId = await crypto.generateUUID();

    const result = await createLearningPath(
      { learningPathRepository, cryptoService: crypto },
      { userId, title: "TypeScript Advanced Patterns", mode: PathMode.SEQUENTIAL },
    );

    if (result instanceof InvalidDataError) throw result;

    expect(result.userId).toBe(userId);
    expect(result.title).toBe("TypeScript Advanced Patterns");
    expect(result.mode).toBe(PathMode.SEQUENTIAL);
    expect(result.source).toBe(PathSource.MANUAL);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  test("should persist the path in the repository", async () => {
    const userId = await crypto.generateUUID();

    await createLearningPath(
      { learningPathRepository, cryptoService: crypto },
      { userId, title: "Docker and Kubernetes Fundamentals", mode: PathMode.GRAPH },
    );

    expect(learningPathRepository.paths).toHaveLength(1);
    expect(learningPathRepository.paths[0]!.title).toBe("Docker and Kubernetes Fundamentals");
  });

  test("should default source to MANUAL when not provided", async () => {
    const userId = await crypto.generateUUID();

    const result = await createLearningPath(
      { learningPathRepository, cryptoService: crypto },
      { userId, title: "Clean Architecture with Node.js", mode: PathMode.SEQUENTIAL },
    );

    if (result instanceof InvalidDataError) throw result;

    expect(result.source).toBe(PathSource.MANUAL);
  });

  test("should accept optional description and sourceSlug", async () => {
    const userId = await crypto.generateUUID();

    const result = await createLearningPath(
      { learningPathRepository, cryptoService: crypto },
      {
        userId,
        title: "Backend Developer Roadmap",
        description: "A structured path covering APIs, databases, caching, and system design",
        mode: PathMode.GRAPH,
        source: PathSource.ROADMAP_SH,
        sourceSlug: "backend",
      },
    );

    if (result instanceof InvalidDataError) throw result;

    expect(result.description).toBe("A structured path covering APIs, databases, caching, and system design");
    expect(result.source).toBe(PathSource.ROADMAP_SH);
    expect(result.sourceSlug).toBe("backend");
  });

  test("should return InvalidDataError when userId is not a valid UUID", async () => {
    const result = await createLearningPath(
      { learningPathRepository, cryptoService: crypto },
      { userId: "not-a-uuid" as any, title: "TypeScript Advanced Patterns", mode: PathMode.SEQUENTIAL },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("should return InvalidDataError when title is missing", async () => {
    const userId = await crypto.generateUUID();

    const result = await createLearningPath(
      { learningPathRepository, cryptoService: crypto },
      { userId, title: "" as any, mode: PathMode.SEQUENTIAL },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("should return InvalidDataError when mode is invalid", async () => {
    const userId = await crypto.generateUUID();

    const result = await createLearningPath(
      { learningPathRepository, cryptoService: crypto },
      { userId, title: "TypeScript Advanced Patterns", mode: "invalid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
