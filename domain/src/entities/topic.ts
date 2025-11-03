import { Entity } from "./entity";
import { TimestampedEntity } from "./timestamped-entity";

export interface Topic extends Entity, TimestampedEntity {
  name: string;
  color?: string;
}
