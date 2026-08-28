import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import {
  NodeProgress,
  PathMode,
  PathSource,
  StubScope,
  type LearningPath,
  type LearningPathEdge,
  type LearningPathNode,
} from "@learning-resource/domain";
import { mockLearningPathRepository } from "../../mocks/mock-learning-path-repository.js";
import { deleteLearningPathEdge } from "./delete-learning-path-edge.js";
import {
  LearningPathEdgeNotFoundError,
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("deleteLearningPathEdge", () => {
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
      title: "Frontend Engineering Roadmap",
      description: "From browser fundamentals to production-grade React and Angular applications",
      mode: PathMode.GRAPH,
      source: PathSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    learningPathRepository.paths.push(path);
    return path;
  }

  async function seedNode(pathId: UUID, title: string): Promise<LearningPathNode> {
    const node: LearningPathNode = {
      id: await crypto.generateUUID(),
      pathId,
      title,
      stubScope: StubScope.PATH_LOCAL,
      progress: NodeProgress.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    learningPathRepository.nodes.push(node);
    return node;
  }

  async function seedEdge(pathId: UUID, sourceNodeId: UUID, targetNodeId: UUID): Promise<LearningPathEdge> {
    const edge: LearningPathEdge = {
      id: await crypto.generateUUID(),
      pathId,
      sourceNodeId,
      targetNodeId,
    };
    learningPathRepository.edges.push(edge);
    return edge;
  }

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const edgeId = await crypto.generateUUID();

    const result = await deleteLearningPathEdge(
      { learningPathRepository },
      { userId, pathId, edgeId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = await seedPath(otherUserId);
    const nodeA = await seedNode(path.id, "HTML and CSS Fundamentals");
    const nodeB = await seedNode(path.id, "JavaScript Core");
    const edge = await seedEdge(path.id, nodeA.id, nodeB.id);

    const result = await deleteLearningPathEdge(
      { learningPathRepository },
      { userId, pathId: path.id, edgeId: edge.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathEdgeNotFoundError when edge does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const edgeId = await crypto.generateUUID();

    const result = await deleteLearningPathEdge(
      { learningPathRepository },
      { userId, pathId: path.id, edgeId },
    );

    expect(result).toBeInstanceOf(LearningPathEdgeNotFoundError);
  });

  test("should return LearningPathEdgeNotFoundError when edge belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const otherPath = await seedPath(userId);
    const nodeA = await seedNode(otherPath.id, "HTML and CSS Fundamentals");
    const nodeB = await seedNode(otherPath.id, "JavaScript Core");
    const edgeFromOtherPath = await seedEdge(otherPath.id, nodeA.id, nodeB.id);

    const result = await deleteLearningPathEdge(
      { learningPathRepository },
      { userId, pathId: path.id, edgeId: edgeFromOtherPath.id },
    );

    expect(result).toBeInstanceOf(LearningPathEdgeNotFoundError);
  });

  test("should delete the edge and return void", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeA = await seedNode(path.id, "HTML and CSS Fundamentals");
    const nodeB = await seedNode(path.id, "JavaScript Core");
    const edge = await seedEdge(path.id, nodeA.id, nodeB.id);

    const result = await deleteLearningPathEdge(
      { learningPathRepository },
      { userId, pathId: path.id, edgeId: edge.id },
    );

    expect(result).toBeUndefined();
    expect(learningPathRepository.edges).toHaveLength(0);
  });

  test("should only delete the targeted edge leaving others intact", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeA = await seedNode(path.id, "HTML and CSS Fundamentals");
    const nodeB = await seedNode(path.id, "JavaScript Core");
    const nodeC = await seedNode(path.id, "TypeScript Essentials");
    const edgeAB = await seedEdge(path.id, nodeA.id, nodeB.id);
    await seedEdge(path.id, nodeB.id, nodeC.id);

    await deleteLearningPathEdge(
      { learningPathRepository },
      { userId, pathId: path.id, edgeId: edgeAB.id },
    );

    expect(learningPathRepository.edges).toHaveLength(1);
    expect(learningPathRepository.edges[0]?.sourceNodeId).toBe(nodeB.id);
  });

  test("should return InvalidDataError when edgeId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();

    const result = await deleteLearningPathEdge(
      { learningPathRepository },
      { userId, pathId, edgeId: "not-a-uuid" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
