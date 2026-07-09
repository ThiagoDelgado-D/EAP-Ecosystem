import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { PathMode, PathSource, type LearningPath } from "@learning-resource/domain";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { listLearningPaths } from "./list-learning-paths.js";

describe("listLearningPaths", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return empty array when user has no paths", async () => {
    const userId = await crypto.generateUUID();

    const result = await listLearningPaths(
      { learningPathRepository },
      { userId },
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("should return only paths belonging to the requesting user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();

    const userPath: LearningPath = {
      id: await crypto.generateUUID(),
      userId,
      title: "React and the Ecosystem",
      mode: PathMode.SEQUENTIAL,
      source: PathSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const otherPath: LearningPath = {
      id: await crypto.generateUUID(),
      userId: otherUserId,
      title: "DevOps Roadmap",
      mode: PathMode.GRAPH,
      source: PathSource.ROADMAP_SH,
      sourceSlug: "devops",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    learningPathRepository.paths.push(userPath, otherPath);

    const result = await listLearningPaths(
      { learningPathRepository },
      { userId },
    );

    if (result instanceof InvalidDataError) throw result;

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(userPath.id);
  });

  test("should return InvalidDataError when userId is not a valid UUID", async () => {
    const result = await listLearningPaths(
      { learningPathRepository },
      { userId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
