import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, type UUID } from "domain-lib";
import type { AccountStats } from "@user/domain";
import { mockAccountStatsPort } from "../../mocks/mock-account-stats-port.js";
import { getAccountStats } from "./get-account-stats.js";

const ACTIVE_LEARNER_STATS: AccountStats = { resources: 23, paths: 4, sessions: 87 };
const NEW_LEARNER_STATS: AccountStats = { resources: 0, paths: 0, sessions: 0 };

describe("getAccountStats", () => {
  let accountStatsPort: ReturnType<typeof mockAccountStatsPort>;
  let activeLearnerId: UUID;
  let newLearnerId: UUID;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    accountStatsPort = mockAccountStatsPort();
    activeLearnerId = await cryptoService.generateUUID();
    newLearnerId = await cryptoService.generateUUID();
    accountStatsPort.statsByUser.set(activeLearnerId, ACTIVE_LEARNER_STATS);
  });

  const deps = () => ({ accountStatsPort });

  test("Should return the counts of the requesting learner", async () => {
    const result = await getAccountStats(deps(), { userId: activeLearnerId });

    expect(result).toEqual(ACTIVE_LEARNER_STATS);
  });

  test("Should return zero counts for a learner with no activity", async () => {
    const result = await getAccountStats(deps(), { userId: newLearnerId });

    expect(result).toEqual(NEW_LEARNER_STATS);
  });
});
