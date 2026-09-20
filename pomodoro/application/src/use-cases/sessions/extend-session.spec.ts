import { beforeEach, describe, expect, test } from "vitest";
import {
  createSessionLifecycleFixture,
  type SessionLifecycleFixture,
} from "../../mocks/index.js";
import { extendSession, MAX_PLANNED_DURATION_MIN } from "./extend-session.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";

describe("extendSession", () => {
  let fixture: SessionLifecycleFixture;

  beforeEach(async () => {
    fixture = await createSessionLifecycleFixture();
  });

  const deps = () => ({ sessionRepository: fixture.sessionRepository });

  test("should add the given minutes to the session's plannedMin in place", async () => {
    const session = await fixture.startFreeSession();

    const result = await extendSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      minutes: 5,
    });

    if (result instanceof Error) throw result;

    expect(result.id).toBe(session.id);
    expect(result.plannedMin).toBe(session.plannedMin + 5);
  });

  test("should cap the resulting plannedMin at the maximum planned duration", async () => {
    const session = await fixture.startFreeSession();
    const storedSession = fixture.sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.plannedMin = MAX_PLANNED_DURATION_MIN - 3;

    const result = await extendSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      minutes: 10,
    });

    if (result instanceof Error) throw result;

    expect(result.plannedMin).toBe(MAX_PLANNED_DURATION_MIN);
  });

  test("returns SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await fixture.cryptoService.generateUUID();

    const result = await extendSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: nonExistentSessionId,
      minutes: 5,
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("returns SessionForbiddenError when the session belongs to another user", async () => {
    const session = await fixture.startFreeSession();
    const intruderId = await fixture.cryptoService.generateUUID();

    const result = await extendSession(deps(), {
      userId: intruderId,
      sessionId: session.id,
      minutes: 5,
    });

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("returns SessionNotActiveError when the session already ended", async () => {
    const session = await fixture.startFreeSession();
    const storedSession = fixture.sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.completedAt = new Date();

    const result = await extendSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      minutes: 5,
    });

    expect(result).toBeInstanceOf(SessionNotActiveError);
  });
});
