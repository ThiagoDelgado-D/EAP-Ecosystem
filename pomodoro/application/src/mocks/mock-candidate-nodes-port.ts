import type { UUID } from "domain-lib";
import type { CandidateNode, CandidateNodesPort } from "@pomodoro/domain";

export interface MockedCandidateNodesPort extends CandidateNodesPort {
  nodesByUser: Record<UUID, CandidateNode[]>;
  reset(): void;
}

export function mockCandidateNodesPort(
  initial: Record<UUID, CandidateNode[]> = {},
): MockedCandidateNodesPort {
  return {
    nodesByUser: { ...initial },

    async findCandidateNodes(userId: UUID): Promise<CandidateNode[]> {
      return this.nodesByUser[userId] ?? [];
    },

    reset(): void {
      this.nodesByUser = {};
    },
  };
}
