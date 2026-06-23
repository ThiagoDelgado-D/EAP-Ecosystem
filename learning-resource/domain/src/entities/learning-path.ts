import type { Entity, TimestampedEntity, UUID } from "domain-lib";

export const PathMode = {
  SEQUENTIAL: "sequential",
  GRAPH: "graph",
} as const;

export type PathMode = (typeof PathMode)[keyof typeof PathMode];

export const PathSource = {
  MANUAL: "manual",
  ROADMAP_SH: "roadmap.sh",
} as const;

export type PathSource = (typeof PathSource)[keyof typeof PathSource];

export interface LearningPath extends Entity, TimestampedEntity {
  userId: UUID;
  title: string;
  description?: string;
  mode: PathMode;
  source: PathSource;
  sourceSlug?: string;
}
