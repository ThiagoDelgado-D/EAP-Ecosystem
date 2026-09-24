import { beforeEach, describe, expect, test } from "vitest";
import { BaseError, mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { mockBreakRepository, seedBreak } from "../../mocks/index.js";
import { getBreakHistory } from "./get-break-history.js";

describe("getBreakHistory", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let breakRepository: ReturnType<typeof mockBreakRepository>;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    breakRepository = mockBreakRepository();
    currentUser = await mockCurrentUser(cryptoService);
  });

  test("should return breaks on or after since", async () => {
    const inRangeBreak = seedBreak(breakRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-10T10:00:00Z"),
    });

    const result = await getBreakHistory(
      { breakRepository, currentUser },
      { since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.map((b) => b.id)).toEqual([inRangeBreak.id]);
  });

  test("should exclude breaks started before since", async () => {
    seedBreak(breakRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-01T10:00:00Z"),
    });

    const result = await getBreakHistory(
      { breakRepository, currentUser },
      { since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result).toHaveLength(0);
  });

  test("should exclude breaks on or after until when given", async () => {
    seedBreak(breakRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-15T10:00:00Z"),
    });
    const inRangeBreak = seedBreak(breakRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-10T10:00:00Z"),
    });

    const result = await getBreakHistory(
      { breakRepository, currentUser },
      {
        since: new Date("2026-09-08T00:00:00Z"),
        until: new Date("2026-09-12T00:00:00Z"),
      },
    );
    if (result instanceof BaseError) throw result;

    expect(result.map((b) => b.id)).toEqual([inRangeBreak.id]);
  });

  test("should not return another user's breaks", async () => {
    const intruderId = await cryptoService.generateUUID();
    seedBreak(breakRepository, {
      userId: intruderId,
      startedAt: new Date("2026-09-10T10:00:00Z"),
    });

    const result = await getBreakHistory(
      { breakRepository, currentUser },
      { since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result).toHaveLength(0);
  });
});
