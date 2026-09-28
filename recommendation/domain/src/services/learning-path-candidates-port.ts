import type { UUID } from "domain-lib";
import type { EnergyLevel, MentalState } from "../entities/recommendation-context.js";

export interface LearningPathNodeCandidate {
  pathId: UUID;
  pathTitle: string;
  nodeId: UUID;
  nodeTitle: string;
  resourceId?: UUID;
  energyLevel?: EnergyLevel;
  mentalState?: MentalState;
  estimatedMinutes?: number;
  lastViewed?: Date;
}

export interface LearningPathCandidatesPort {
  findActivePathCandidates(userId: UUID): Promise<LearningPathNodeCandidate[]>;
}
