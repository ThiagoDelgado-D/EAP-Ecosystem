import { beforeEach, describe, expect, test } from "vitest";
import { BaseError, mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { mockSessionRepository, seedSegment, seedSession } from "../../mocks/index.js";
import { getSessionHistory } from "./get-session-history.js";

describe("getSessionHistory", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    currentUser = await mockCurrentUser(cryptoService);
  });

  test("should return sessions and segments on or after since", async () => {
    const inRangeSession = seedSession(sessionRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-10T10:00:00Z"),
    });
    seedSegment(sessionRepository, { sessionId: inRangeSession.id, endSec: 25 * 60 });

    const result = await getSessionHistory(
      { sessionRepository, currentUser },
      { since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions.map((s) => s.id)).toEqual([inRangeSession.id]);
    expect(result.segments).toHaveLength(1);
  });

  test("should exclude sessions started before since", async () => {
    seedSession(sessionRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-01T10:00:00Z"),
    });

    const result = await getSessionHistory(
      { sessionRepository, currentUser },
      { since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions).toHaveLength(0);
    expect(result.segments).toHaveLength(0);
  });

  test("should exclude sessions on or after until when given", async () => {
    seedSession(sessionRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-15T10:00:00Z"),
    });
    const inRangeSession = seedSession(sessionRepository, {
      userId: currentUser.id,
      startedAt: new Date("2026-09-10T10:00:00Z"),
    });

    const result = await getSessionHistory(
      { sessionRepository, currentUser },
      {
        since: new Date("2026-09-08T00:00:00Z"),
        until: new Date("2026-09-12T00:00:00Z"),
      },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions.map((s) => s.id)).toEqual([inRangeSession.id]);
  });

  test("should not return another user's sessions", async () => {
    const intruderId = await cryptoService.generateUUID();
    seedSession(sessionRepository, {
      userId: intruderId,
      startedAt: new Date("2026-09-10T10:00:00Z"),
    });

    const result = await getSessionHistory(
      { sessionRepository, currentUser },
      { since: new Date("2026-09-08T00:00:00Z") },
    );
    if (result instanceof BaseError) throw result;

    expect(result.sessions).toHaveLength(0);
  });
});
