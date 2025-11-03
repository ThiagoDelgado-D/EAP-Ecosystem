import { Entity } from "./entity";
import { Person } from "./person";
import { TimestampedEntity } from "./timestamped-entity";

export interface User extends Entity, Person, TimestampedEntity {
  userName?: string | null;
  emailVerified: boolean;
  hashedPassword: string;
  enabled: boolean;
}
