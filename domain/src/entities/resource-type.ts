import { UUID } from "../types/uuid";
import { TimestampedEntity } from "./timestamped-entity";

export interface ResourceType extends TimestampedEntity {
  id: UUID;
  code: string;
  displayName: string;
  isActive?: boolean;
}
