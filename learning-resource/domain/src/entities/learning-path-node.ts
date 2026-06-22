import type { Entity, TimestampedEntity, UUID } from "domain-lib";
import type { LearningPath } from "./learning-path.js";
import type { LearningPathEdge } from "./learning-path-edge.js";

export const NodeProgress = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

export type NodeProgress = (typeof NodeProgress)[keyof typeof NodeProgress];

export const StubScope = {
  PATH_LOCAL: "path-local",
  CATALOG: "catalog",
} as const;

export type StubScope = (typeof StubScope)[keyof typeof StubScope];

export interface LearningPathNode extends Entity, TimestampedEntity {
  pathId: UUID;
  title: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: UUID;
  stubScope?: StubScope;
  order?: number;
  progress: NodeProgress;
}

export interface LearningPathWithNodes {
  path: LearningPath;
  nodes: LearningPathNode[];
  edges: LearningPathEdge[];
}
