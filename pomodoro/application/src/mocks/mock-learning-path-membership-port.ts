import type { UUID } from "domain-lib";
import type {
  LearningPathMembership,
  LearningPathMembershipPort,
} from "@pomodoro/domain";

export interface MockedLearningPathMembershipPort
  extends LearningPathMembershipPort {
  memberships: Record<UUID, LearningPathMembership[]>;
  ownedNodes: Set<string>;
  grantNodeOwnership(
    learningPathId: UUID,
    learningPathNodeId: UUID,
    userId: UUID,
  ): void;
  reset(): void;
}

export function mockLearningPathMembershipPort(
  initial: Record<UUID, LearningPathMembership[]> = {},
): MockedLearningPathMembershipPort {
  return {
    memberships: { ...initial },
    ownedNodes: new Set(),

    async findPathsForResource(
      resourceId: UUID,
      _userId: UUID,
    ): Promise<LearningPathMembership[]> {
      return this.memberships[resourceId] ?? [];
    },

    async verifyNodeOwnership(
      learningPathId: UUID,
      learningPathNodeId: UUID,
      userId: UUID,
    ): Promise<boolean> {
      return this.ownedNodes.has(`${learningPathId}:${learningPathNodeId}:${userId}`);
    },

    grantNodeOwnership(
      learningPathId: UUID,
      learningPathNodeId: UUID,
      userId: UUID,
    ): void {
      this.ownedNodes.add(`${learningPathId}:${learningPathNodeId}:${userId}`);
    },

    reset(): void {
      this.memberships = {};
      this.ownedNodes = new Set();
    },
  };
}
