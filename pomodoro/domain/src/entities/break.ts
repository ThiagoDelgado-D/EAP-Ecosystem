import type { Entity, UUID } from "domain-lib";

export interface Break extends Entity {
  userId: UUID;
  startedAt: Date;
  durationSec: number;
  endedAt?: Date;
}
