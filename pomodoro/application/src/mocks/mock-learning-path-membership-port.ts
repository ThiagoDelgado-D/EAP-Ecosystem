import type { UUID } from "domain-lib";
import type {
  LearningPathMembership,
  LearningPathMembershipPort,
} from "@pomodoro/domain";

export interface MockedLearningPathMembershipPort
  extends LearningPathMembershipPort {
  memberships: Record<UUID, LearningPathMembership[]>;
  reset(): void;
}

export function mockLearningPathMembershipPort(
  initial: Record<UUID, LearningPathMembership[]> = {},
): MockedLearningPathMembershipPort {
  return {
    memberships: { ...initial },

    async findPathsForResource(
      resourceId: UUID,
    ): Promise<LearningPathMembership[]> {
      return this.memberships[resourceId] ?? [];
    },

    reset(): void {
      this.memberships = {};
    },
  };
}
