import { Entity } from "../types/entity";
import { TimestampedEntity } from "./timestamped-entity";

export interface Topic extends Entity, TimestampedEntity {
  name: string;
  color?: string;
}
