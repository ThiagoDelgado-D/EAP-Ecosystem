import type { Entity, TimestampedEntity, UUID } from "domain-lib";

export const TopicTone = {
  PINE: "pine",
  OCHRE: "ochre",
  EMBER: "ember",
  INFO: "info",
  PLUM: "plum",
  SLATE: "slate",
} as const;

export type TopicTone = (typeof TopicTone)[keyof typeof TopicTone];

export interface Topic extends Entity, TimestampedEntity {
  userId: UUID;
  name: string;
  color: TopicTone;
}

export interface TopicWithUsage extends Topic {
  resourceCount: number;
}
