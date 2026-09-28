import type { UUID } from "domain-lib";
import type {
  LearningPathCandidatesPort,
  LearningPathNodeCandidate,
} from "@recommendation/domain";

export interface MockedLearningPathCandidatesPort
  extends LearningPathCandidatesPort {
  candidatesByUser: Record<UUID, LearningPathNodeCandidate[]>;
  reset(): void;
}

export function mockLearningPathCandidatesPort(
  initial: Record<UUID, LearningPathNodeCandidate[]> = {},
): MockedLearningPathCandidatesPort {
  return {
    candidatesByUser: { ...initial },

    async findActivePathCandidates(
      userId: UUID,
    ): Promise<LearningPathNodeCandidate[]> {
      return this.candidatesByUser[userId] ?? [];
    },

    reset(): void {
      this.candidatesByUser = {};
    },
  };
}
