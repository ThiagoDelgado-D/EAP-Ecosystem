import { InvalidDataError, mockCurrentUser } from "domain-lib";
import { SegmentTargetKind } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  createSessionLifecycleFixture,
  type SessionLifecycleFixture,
} from "../../mocks/index.js";
import { continueSession } from "./continue-session.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";

describe("continueSession", () => {
  let fixture: SessionLifecycleFixture;

  beforeEach(async () => {
    fixture = await createSessionLifecycleFixture();
  });

  const deps = () => ({
    sessionRepository: fixture.sessionRepository,
    cryptoService: fixture.cryptoService,
    currentUser: fixture.currentUser,
  });

  test("closes the current session exactly at plannedMin and starts a new one against the same target", async () => {
    const session = await fixture.startFreeSession();
    const storedSession = fixture.sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.startedAt = new Date(Date.now() - 3600 * 1000);

    const result = await continueSession(deps(), {
      sessionId: session.id,
    });

    if (result instanceof Error) throw result;

    expect(result.closedSession.completedAt).toEqual(
      new Date(storedSession.startedAt.getTime() + session.plannedMin * 60 * 1000),
    );
    expect(result.closedSession.autoCompleted).toBe(false);

    expect(result.session.id).not.toBe(session.id);
    expect(result.session.startedAt).toEqual(result.closedSession.completedAt);
    expect(result.session.plannedMin).toBe(session.plannedMin);
    expect(result.session.completedAt).toBeUndefined();

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.targetKind).toBe(SegmentTargetKind.FREE);
    expect(result.segments[0]!.startSec).toBe(0);
    expect(result.segments[0]!.endSec).toBeUndefined();

    const closedSegment = fixture.sessionRepository.segments.find(
      (segment) => segment.sessionId === session.id,
    );
    expect(closedSegment?.endSec).toBe(session.plannedMin * 60);
  });

  test("returns InvalidDataError when sessionId is missing", async () => {
    const result = await continueSession(deps(), {} as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("returns SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await fixture.cryptoService.generateUUID();

    const result = await continueSession(deps(), {
      sessionId: nonExistentSessionId,
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("returns SessionForbiddenError when the session belongs to another user", async () => {
    const session = await fixture.startFreeSession();
    const intruder = await mockCurrentUser(fixture.cryptoService);

    const result = await continueSession(
      { ...deps(), currentUser: intruder },
      { sessionId: session.id },
    );

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("returns SessionNotActiveError when the session already ended", async () => {
    const session = await fixture.startFreeSession();
    const storedSession = fixture.sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.completedAt = new Date();

    const result = await continueSession(deps(), {
      sessionId: session.id,
    });

    expect(result).toBeInstanceOf(SessionNotActiveError);
  });

  test("returns NoOpenSegmentError when the active session has no open segment", async () => {
    const session = await fixture.startFreeSession();
    const openSegment = await fixture.sessionRepository.findOpenSegmentBySessionId(
      session.id,
    );
    await fixture.sessionRepository.updateSegment({ ...openSegment!, endSec: 120 });

    const result = await continueSession(deps(), {
      sessionId: session.id,
    });

    expect(result).toBeInstanceOf(NoOpenSegmentError);
  });
});
