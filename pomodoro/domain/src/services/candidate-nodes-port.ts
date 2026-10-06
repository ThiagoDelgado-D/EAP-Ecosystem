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

export const CandidateNodeMentalState = {
  DEEP_FOCUS: "deep_focus",
  LIGHT_READ: "light_read",
  CREATIVE: "creative",
  QUICK_OP: "quick_op",
  REVIEW: "review",
} as const;

export type CandidateNodeMentalState =
  (typeof CandidateNodeMentalState)[keyof typeof CandidateNodeMentalState];

export interface CandidateNode {
  pathId: UUID;
  pathTitle: string;
  nodeId: UUID;
  nodeTitle: string;
  progress: CandidateNodeProgress;
  prerequisitesDone: boolean;
  resourceId?: UUID;
  resourceEnergyLevel?: CandidateNodeEnergyLevel;
  resourceMentalState?: CandidateNodeMentalState;
}

export interface CandidateNodesPort {
  findCandidateNodes(userId: UUID): Promise<CandidateNode[]>;
}
