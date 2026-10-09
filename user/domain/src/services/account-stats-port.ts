import type { UUID } from "domain-lib";

export interface AccountStats {
  resources: number;
  paths: number;
  sessions: number;
}

export interface AccountStatsPort {
  countFor(userId: UUID): Promise<AccountStats>;
}
