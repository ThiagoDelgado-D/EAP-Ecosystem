import { beforeEach, describe, expect, test } from "vitest";
import { BaseError, mockCryptoService, type UUID } from "domain-lib";
import { mockSessionRepository } from "../../mocks/index.js";
import { getSessionHistory } from "./get-session-history.js";

describe("getSessionHistory", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    requestingUserId = await cryptoService.generateUUID();
  });

  const seedSession = async (userId: UUID, startedAt: Date) => {
    const sessionId = await cryptoService.generateUUID();
    await sessionRepository.save({
      id: sessionId,
      userId,
      startedAt,
      plannedMin: 25,
    });
    await sessionRepository.saveSegment({
      id: await cryptoService.generateUUID(),
      sessionId,
      startSec: 0,
      endSec: 25 * 60,
      targetKind: "free",
    });
    return sessionId;
  };

  test("should return sessions and segments on or after since", async () => {
    const inRangeId = await seedSession(
      requestingUserId,
      new Date("2026-09-10T10:00:00Z"),
    );

    const result = await getSessionHistory(
      { sessionRepository },
      { userId: requestingUserId, since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions.map((s) => s.id)).toEqual([inRangeId]);
    expect(result.segments).toHaveLength(1);
  });

  test("should exclude sessions started before since", async () => {
    await seedSession(requestingUserId, new Date("2026-09-01T10:00:00Z"));

    const result = await getSessionHistory(
      { sessionRepository },
      { userId: requestingUserId, since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions).toHaveLength(0);
    expect(result.segments).toHaveLength(0);
  });

  test("should exclude sessions on or after until when given", async () => {
    await seedSession(requestingUserId, new Date("2026-09-15T10:00:00Z"));
    const inRangeId = await seedSession(
      requestingUserId,
      new Date("2026-09-10T10:00:00Z"),
    );

    const result = await getSessionHistory(
      { sessionRepository },
      {
        userId: requestingUserId,
        since: new Date("2026-09-08T00:00:00Z"),
        until: new Date("2026-09-12T00:00:00Z"),
      },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions.map((s) => s.id)).toEqual([inRangeId]);
  });

  test("should not return another user's sessions", async () => {
    const intruderId = await cryptoService.generateUUID();
    await seedSession(intruderId, new Date("2026-09-10T10:00:00Z"));

    const result = await getSessionHistory(
      { sessionRepository },
      { userId: requestingUserId, since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions).toHaveLength(0);
  });
});
