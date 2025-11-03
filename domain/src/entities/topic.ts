import { UUID } from "../types/uuid";
import { TimestampedEntity } from "./timestamped-entity";

export interface Topic extends TimestampedEntity {
  id: UUID;
  name: string;
  color?: string;
}
