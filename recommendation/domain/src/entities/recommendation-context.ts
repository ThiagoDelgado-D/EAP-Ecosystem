import type { UUID } from "domain-lib";

export const EnergyLevel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type EnergyLevel = (typeof EnergyLevel)[keyof typeof EnergyLevel];

export const MentalState = {
  DEEP_FOCUS: "deep_focus",
  LIGHT_READ: "light_read",
  CREATIVE: "creative",
  QUICK_OP: "quick_op",
  REVIEW: "review",
} as const;

export type MentalState = (typeof MentalState)[keyof typeof MentalState];

export interface RecommendationContext {
  userId: UUID;
  energyLevel: EnergyLevel;
  availableMinutes?: number;
  mentalState?: MentalState;
  updatedAt: Date;
}
