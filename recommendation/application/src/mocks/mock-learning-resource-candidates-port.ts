import type { UUID } from "domain-lib";
import type {
  LearningResourceCandidate,
  LearningResourceCandidatesPort,
} from "@recommendation/domain";

export interface MockedLearningResourceCandidatesPort
  extends LearningResourceCandidatesPort {
  candidatesByUser: Record<UUID, LearningResourceCandidate[]>;
  reset(): void;
}

export function mockLearningResourceCandidatesPort(
  initial: Record<UUID, LearningResourceCandidate[]> = {},
): MockedLearningResourceCandidatesPort {
  return {
    candidatesByUser: { ...initial },

    async findCandidates(userId: UUID): Promise<LearningResourceCandidate[]> {
      return this.candidatesByUser[userId] ?? [];
    },

    reset(): void {
      this.candidatesByUser = {};
    },
  };
}
