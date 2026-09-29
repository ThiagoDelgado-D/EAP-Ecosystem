export const ENERGY_LEVELS = ['low', 'medium', 'high'] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const MENTAL_STATES = ['deep_focus', 'light_read', 'creative', 'quick_op', 'review'] as const;
export type MentalState = (typeof MENTAL_STATES)[number];

export interface ScoredRecommendation {
  resourceId?: string;
  nodeId?: string;
  pathId?: string;
  title: string;
  score: number;
  why: string[];
}

export interface SetRecommendationContextPayload {
  energyLevel: EnergyLevel;
  availableMinutes?: number;
  mentalState?: MentalState;
}
