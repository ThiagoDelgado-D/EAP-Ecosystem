import type { Entity } from "domain-lib";

export interface Session extends Entity {
  startedAt: Date;
  completedAt?: Date;
  intent?: string;
  plannedMin: number;
}
