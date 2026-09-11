import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import {
  seedLearningPath,
  seedLearningPathEdge,
  seedLearningPathNode,
} from "../../mocks/factories.js";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { listLearningPathsWithNodes } from "./list-learning-paths-with-nodes.js";

describe("listLearningPathsWithNodes", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    learningPathRepository = mockLearningPathRepository();
  });

  test("should return empty array when user has no paths", async () => {
    const userId = await crypto.generateUUID();

    const result = await listLearningPathsWithNodes(
      { learningPathRepository },
      { userId },
    );

    expect(result).toEqual([]);
  });

  test("should return only paths belonging to the requesting user, each with its nodes and edges", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();

    const userPath = seedLearningPath(learningPathRepository, { userId });
    const userNode1 = seedLearningPathNode(learningPathRepository, { pathId: userPath.id });
    const userNode2 = seedLearningPathNode(learningPathRepository, { pathId: userPath.id });
    const userEdge = seedLearningPathEdge(learningPathRepository, {
      pathId: userPath.id,
      sourceNodeId: userNode1.id,
      targetNodeId: userNode2.id,
    });

    const otherPath = seedLearningPath(learningPathRepository, { userId: otherUserId });
    seedLearningPathNode(learningPathRepository, { pathId: otherPath.id });

    const result = await listLearningPathsWithNodes(
      { learningPathRepository },
      { userId },
    );

    if (result instanceof InvalidDataError) throw result;

    expect(result).toHaveLength(1);
    expect(result[0].path.id).toBe(userPath.id);
    expect(result[0].nodes.map((n) => n.id)).toEqual(
      expect.arrayContaining([userNode1.id, userNode2.id]),
    );
    expect(result[0].edges).toEqual([userEdge]);
  });

  test("should populate stats from the path's own nodes", async () => {
    const userId = await crypto.generateUUID();

    const path = seedLearningPath(learningPathRepository, { userId });
    seedLearningPathNode(learningPathRepository, {
      pathId: path.id,
      progress: "done",
      learningResourceId: await crypto.generateUUID(),
    });
    seedLearningPathNode(learningPathRepository, { pathId: path.id, progress: "pending" });
    seedLearningPathNode(learningPathRepository, { pathId: path.id, progress: "in_progress" });

    const result = await listLearningPathsWithNodes(
      { learningPathRepository },
      { userId },
    );

    if (result instanceof InvalidDataError) throw result;

    expect(result[0].path.stats).toEqual({ total: 3, done: 1, linked: 1 });
  });

  test("should return InvalidDataError when userId is not a valid UUID", async () => {
    const result = await listLearningPathsWithNodes(
      { learningPathRepository },
      { userId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
