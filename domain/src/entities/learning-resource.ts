import { Entity } from "./entity";
import { UUID } from "../types/uuid";
import { TimestampedEntity } from "./timestamped-entity";

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

export type DifficultyType = keyof typeof DifficultyType;

export const ResourceStatusType = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export type ResourceStatusType = keyof typeof ResourceStatusType;

export const EnergyLevelType = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type EnergyLevelType = keyof typeof EnergyLevelType;
