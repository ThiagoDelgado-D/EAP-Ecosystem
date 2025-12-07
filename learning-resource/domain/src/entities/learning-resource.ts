import type { Entity, TimestampedEntity, UUID } from "domain-lib";

export interface LearningResource extends Entity, TimestampedEntity {
  title: string;
  url?: string;
  typeId: UUID;
  topicIds: UUID[];
  difficulty: DifficultyType;
  estimatedDuration: Duration;
  energyLevel: EnergyLevelType;
  status: ResourceStatusType;
  lastViewed?: Date;
  notes?: string;
}

export interface Duration {
  value: number;
  isEstimated: boolean;
}

export const DifficultyType = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type DifficultyType =
  (typeof DifficultyType)[keyof typeof DifficultyType];

export const ResourceStatusType = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export type ResourceStatusType =
  (typeof ResourceStatusType)[keyof typeof ResourceStatusType];

export const EnergyLevelType = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type EnergyLevelType =
  (typeof EnergyLevelType)[keyof typeof EnergyLevelType];
