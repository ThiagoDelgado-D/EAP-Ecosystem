import type { UUID } from "domain-lib";
import type { EnergyLevel, MentalState } from "../entities/recommendation-context.js";

export interface LearningResourceCandidate {
  resourceId: UUID;
  title: string;
  energyLevel: EnergyLevel;
  mentalState?: MentalState;
  estimatedMinutes?: number;
  lastViewed?: Date;
}

export interface LearningResourceCandidatesPort {
  findCandidates(userId: UUID): Promise<LearningResourceCandidate[]>;
}
