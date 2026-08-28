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
import { addLearningPathEdge } from "./add-learning-path-edge.js";
import {
  DuplicateLearningPathEdgeError,
  LearningPathForbiddenError,
  LearningPathNodeNotFoundError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

describe("addLearningPathEdge", () => {
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
      title: "Backend Engineering Roadmap",
      description: "From HTTP fundamentals to distributed systems and event-driven architecture",
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

  test("should return LearningPathNotFoundError when path does not exist", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const sourceNodeId = await crypto.generateUUID();
    const targetNodeId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId, sourceNodeId, targetNodeId },
    );

    expect(result).toBeInstanceOf(LearningPathNotFoundError);
  });

  test("should return LearningPathForbiddenError when path belongs to another user", async () => {
    const userId = await crypto.generateUUID();
    const otherUserId = await crypto.generateUUID();
    const path = await seedPath(otherUserId);
    const nodeA = await seedNode(path.id, "HTTP and REST Fundamentals");
    const nodeB = await seedNode(path.id, "Authentication and Authorization");

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(LearningPathForbiddenError);
  });

  test("should return LearningPathNodeNotFoundError when source node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeB = await seedNode(path.id, "Authentication and Authorization");
    const nonExistentId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nonExistentId, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when target node does not exist", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeA = await seedNode(path.id, "HTTP and REST Fundamentals");
    const nonExistentId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nonExistentId },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return LearningPathNodeNotFoundError when source node belongs to a different path", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const otherPath = await seedPath(userId);
    const nodeFromOtherPath = await seedNode(otherPath.id, "HTTP and REST Fundamentals");
    const nodeB = await seedNode(path.id, "Authentication and Authorization");

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeFromOtherPath.id, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(LearningPathNodeNotFoundError);
  });

  test("should return DuplicateLearningPathEdgeError when edge already exists", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeA = await seedNode(path.id, "HTTP and REST Fundamentals");
    const nodeB = await seedNode(path.id, "Authentication and Authorization");

    await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    expect(result).toBeInstanceOf(DuplicateLearningPathEdgeError);
  });

  test("should return InvalidDataError when source and target nodes are the same", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const node = await seedNode(path.id, "HTTP and REST Fundamentals");

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: node.id, targetNodeId: node.id },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("should create the edge and return it", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeA = await seedNode(path.id, "HTTP and REST Fundamentals");
    const nodeB = await seedNode(path.id, "Authentication and Authorization");

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof DuplicateLearningPathEdgeError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(result.pathId).toBe(path.id);
    expect(result.sourceNodeId).toBe(nodeA.id);
    expect(result.targetNodeId).toBe(nodeB.id);
    expect(learningPathRepository.edges).toHaveLength(1);
  });

  test("should allow reverse direction edge between the same two nodes", async () => {
    const userId = await crypto.generateUUID();
    const path = await seedPath(userId);
    const nodeA = await seedNode(path.id, "HTTP and REST Fundamentals");
    const nodeB = await seedNode(path.id, "Authentication and Authorization");

    await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeA.id, targetNodeId: nodeB.id },
    );

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId: path.id, sourceNodeId: nodeB.id, targetNodeId: nodeA.id },
    );

    if (result instanceof LearningPathNotFoundError) throw result;
    if (result instanceof LearningPathForbiddenError) throw result;
    if (result instanceof LearningPathNodeNotFoundError) throw result;
    if (result instanceof DuplicateLearningPathEdgeError) throw result;
    if (result instanceof InvalidDataError) throw result;

    expect(learningPathRepository.edges).toHaveLength(2);
  });

  test("should return InvalidDataError when sourceNodeId is not a valid UUID", async () => {
    const userId = await crypto.generateUUID();
    const pathId = await crypto.generateUUID();
    const targetNodeId = await crypto.generateUUID();

    const result = await addLearningPathEdge(
      { learningPathRepository, cryptoService: crypto },
      { userId, pathId, sourceNodeId: "not-a-uuid" as any, targetNodeId },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
