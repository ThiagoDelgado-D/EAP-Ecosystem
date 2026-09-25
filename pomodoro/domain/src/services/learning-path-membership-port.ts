import type { UUID } from "domain-lib";

export interface LearningPathMembership {
  pathId: UUID;
  pathTitle: string;
  nodeId: UUID;
}

export interface LearningPathMembershipPort {
  findPathsForResource(
    resourceId: UUID,
    userId: UUID,
  ): Promise<LearningPathMembership[]>;
  verifyNodeOwnership(
    learningPathId: UUID,
    learningPathNodeId: UUID,
    userId: UUID,
  ): Promise<boolean>;
}
