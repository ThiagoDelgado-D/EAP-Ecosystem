import type { Entity, Person, TimestampedEntity } from "domain-lib";

export interface User extends Entity, Person, TimestampedEntity {
  userName?: string | null;
  emailVerified: boolean;
  hashedPassword: string;
  enabled: boolean;
}
