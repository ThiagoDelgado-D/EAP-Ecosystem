import type { EnergyLevel, MentalState } from '../domain/recommendation.model';

export interface ScoredRecommendationDto {
  resourceId?: string;
  nodeId?: string;
  pathId?: string;
  title: string;
  score: number;
  why: string[];
}

export interface SetRecommendationContextRequestDto {
  energyLevel: EnergyLevel;
  availableMinutes?: number;
  mentalState?: MentalState;
}

export interface RecommendationContextResponseDto {
  userId: string;
  energyLevel: EnergyLevel;
  availableMinutes?: number;
  mentalState?: MentalState;
  updatedAt: string;
}
