import type { UUID } from "domain-lib";

export const CandidateNodeProgress = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

export type CandidateNodeProgress =
  (typeof CandidateNodeProgress)[keyof typeof CandidateNodeProgress];

export const CandidateNodeEnergyLevel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type CandidateNodeEnergyLevel =
  (typeof CandidateNodeEnergyLevel)[keyof typeof CandidateNodeEnergyLevel];

export interface CandidateNode {
  pathId: UUID;
  pathTitle: string;
  nodeId: UUID;
  nodeTitle: string;
  progress: CandidateNodeProgress;
  prerequisitesDone: boolean;
  resourceId?: UUID;
  resourceEnergyLevel?: CandidateNodeEnergyLevel;
}

export interface CandidateNodesPort {
  findCandidateNodes(userId: UUID): Promise<CandidateNode[]>;
}
