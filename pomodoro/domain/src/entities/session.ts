import type { Entity, UUID } from "domain-lib";

export interface Session extends Entity {
  userId: UUID;
  startedAt: Date;
  completedAt?: Date;
  intent?: string;
  plannedMin: number;
}
