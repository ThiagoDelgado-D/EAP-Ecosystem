import { UUID } from "../types/uuid";
import { TimestampedEntity } from "./timestamped-entity";

export interface LearningResource extends TimestampedEntity {
  id: UUID;
  title: string;
  url?: string;
  type: ResourceType;
  topicIds: UUID[];
  difficulty: DifficultyType;
  estimatedDuration: Duration;
  energyLevel: EnergyLevelType;
  status: ResourceStatusType;
  lastViewed?: Date;
  notes?: string;
}

export const ResourceType = {
  ARTICLE: "article",
  VIDEO: "video",
  COURSE: "course",
  BOOK: "book",
  PERSONAL_NOTE: "personal_note",
} as const;

export type ResourceType = keyof typeof ResourceType;

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
