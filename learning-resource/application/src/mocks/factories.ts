import { faker } from "@faker-js/faker";
import {
  NodeProgress,
  PathMode,
  PathSource,
  StubScope,
  type LearningPath,
  type LearningPathEdge,
  type LearningPathNode,
} from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import type { MockedLearningPathRepository } from "./mock-learning-path-repository.js";

export const generateLearningPath = (opts?: Partial<LearningPath>): LearningPath => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    userId: faker.string.uuid() as UUID,
    title: faker.hacker.phrase(),
    description: faker.lorem.sentence(),
    mode: faker.helpers.arrayElement(Object.values(PathMode)),
    source: PathSource.MANUAL,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    ...opts,
  };
};

export const generateLearningPathNode = (opts?: Partial<LearningPathNode>): LearningPathNode => {
  const createdAt = faker.date.past({ years: 1 });
  const base = {
    id: faker.string.uuid() as UUID,
    pathId: faker.string.uuid() as UUID,
    title: faker.hacker.phrase(),
    order: faker.number.int({ min: 1, max: 20 }),
    progress: faker.helpers.arrayElement(Object.values(NodeProgress)),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };

  if (opts?.learningResourceId) {
    return { ...base, ...opts, learningResourceId: opts.learningResourceId } as LearningPathNode;
  }

  return { ...base, stubScope: StubScope.PATH_LOCAL, ...opts } as LearningPathNode;
};

export const generateLearningPathEdge = (opts?: Partial<LearningPathEdge>): LearningPathEdge => ({
  id: faker.string.uuid() as UUID,
  pathId: faker.string.uuid() as UUID,
  sourceNodeId: faker.string.uuid() as UUID,
  targetNodeId: faker.string.uuid() as UUID,
  ...opts,
});

export const seedLearningPath = (
  repo: MockedLearningPathRepository,
  opts?: Partial<LearningPath>,
): LearningPath => {
  const path = generateLearningPath(opts);
  repo.paths.push(path);
  return path;
};

export const seedLearningPathNode = (
  repo: MockedLearningPathRepository,
  opts?: Partial<LearningPathNode>,
): LearningPathNode => {
  const node = generateLearningPathNode(opts);
  repo.nodes.push(node);
  return node;
};

export const seedLearningPathEdge = (
  repo: MockedLearningPathRepository,
  opts?: Partial<LearningPathEdge>,
): LearningPathEdge => {
  const edge = generateLearningPathEdge(opts);
  repo.edges.push(edge);
  return edge;
};
