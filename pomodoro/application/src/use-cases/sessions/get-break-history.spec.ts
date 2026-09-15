import { beforeEach, describe, expect, test } from "vitest";
import { BaseError, mockCryptoService, type UUID } from "domain-lib";
import { mockBreakRepository } from "../../mocks/index.js";
import { getBreakHistory } from "./get-break-history.js";

describe("getBreakHistory", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let breakRepository: ReturnType<typeof mockBreakRepository>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    breakRepository = mockBreakRepository();
    requestingUserId = await cryptoService.generateUUID();
  });

  const seedBreak = async (userId: UUID, startedAt: Date) => {
    const breakId = await cryptoService.generateUUID();
    await breakRepository.save({
      id: breakId,
      userId,
      startedAt,
      durationSec: 300,
    });
    return breakId;
  };

  test("should return breaks on or after since", async () => {
    const inRangeId = await seedBreak(
      requestingUserId,
      new Date("2026-09-10T10:00:00Z"),
    );

    const result = await getBreakHistory(
      { breakRepository },
      { userId: requestingUserId, since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.map((b) => b.id)).toEqual([inRangeId]);
  });

  test("should exclude breaks started before since", async () => {
    await seedBreak(requestingUserId, new Date("2026-09-01T10:00:00Z"));

    const result = await getBreakHistory(
      { breakRepository },
      { userId: requestingUserId, since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result).toHaveLength(0);
  });

  test("should exclude breaks on or after until when given", async () => {
    await seedBreak(requestingUserId, new Date("2026-09-15T10:00:00Z"));
    const inRangeId = await seedBreak(
      requestingUserId,
      new Date("2026-09-10T10:00:00Z"),
    );

    const result = await getBreakHistory(
      { breakRepository },
      {
        userId: requestingUserId,
        since: new Date("2026-09-08T00:00:00Z"),
        until: new Date("2026-09-12T00:00:00Z"),
      },
    );
    if (result instanceof BaseError) throw result;

    expect(result.map((b) => b.id)).toEqual([inRangeId]);
  });

  test("should not return another user's breaks", async () => {
    const intruderId = await cryptoService.generateUUID();
    await seedBreak(intruderId, new Date("2026-09-10T10:00:00Z"));

    const result = await getBreakHistory(
      { breakRepository },
      { userId: requestingUserId, since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result).toHaveLength(0);
  });
});
