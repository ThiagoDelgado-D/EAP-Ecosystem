import { TimestampedEntity, UUID } from "domain-lib";

export interface ResourceType extends TimestampedEntity {
  id: UUID;
  code: string;
  displayName: string;
  isActive?: boolean;
}
