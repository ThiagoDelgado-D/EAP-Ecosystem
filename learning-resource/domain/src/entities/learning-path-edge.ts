import type { Entity, UUID } from "domain-lib";

export interface LearningPathEdge extends Entity {
  pathId: UUID;
  sourceNodeId: UUID;
  targetNodeId: UUID;
}
