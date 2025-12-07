import type { Entity, TimestampedEntity } from "domain-lib";

export interface Topic extends Entity, TimestampedEntity {
  name: string;
  color?: string;
}
