import type { Entity, TimestampedEntity, UUID } from "domain-lib";

export const RelationType = {
  PREREQUISITE: "prerequisite",
  BUILDS_ON: "builds_on",
  RELATED: "related",
  ALTERNATIVE: "alternative",
} as const;

export type RelationType = (typeof RelationType)[keyof typeof RelationType];

export interface ResourceRelation extends Entity, TimestampedEntity {
  sourceResourceId: UUID;
  targetResourceId: UUID;
  type: RelationType;
  userId: UUID;
}
