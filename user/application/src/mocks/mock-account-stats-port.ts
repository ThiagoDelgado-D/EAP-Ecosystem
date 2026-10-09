import type { UUID } from "domain-lib";
import type { AccountStats, AccountStatsPort } from "@user/domain";

const EMPTY_ACCOUNT_STATS: AccountStats = { resources: 0, paths: 0, sessions: 0 };

export interface MockedAccountStatsPort extends AccountStatsPort {
  statsByUser: Map<UUID, AccountStats>;
}

export function mockAccountStatsPort(): MockedAccountStatsPort {
  const statsByUser = new Map<UUID, AccountStats>();

  return {
    statsByUser,

    async countFor(userId: UUID): Promise<AccountStats> {
      return statsByUser.get(userId) ?? EMPTY_ACCOUNT_STATS;
    },
  };
}
