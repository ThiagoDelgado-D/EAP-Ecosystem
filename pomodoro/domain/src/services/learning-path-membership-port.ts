import type { UUID } from "domain-lib";

export interface LearningPathMembership {
  pathId: UUID;
  pathTitle: string;
  nodeId: UUID;
}

export interface LearningPathMembershipPort {
  findPathsForResource(resourceId: UUID): Promise<LearningPathMembership[]>;
}
