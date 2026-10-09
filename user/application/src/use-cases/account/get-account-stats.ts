import type { AccountStats, AccountStatsPort } from "@user/domain";
import type { UUID } from "domain-lib";

export interface GetAccountStatsDependencies {
  accountStatsPort: AccountStatsPort;
}

export interface GetAccountStatsRequest {
  userId: UUID;
}

export const getAccountStats = async (
  { accountStatsPort }: GetAccountStatsDependencies,
  request: GetAccountStatsRequest,
): Promise<AccountStats> => accountStatsPort.countFor(request.userId);
