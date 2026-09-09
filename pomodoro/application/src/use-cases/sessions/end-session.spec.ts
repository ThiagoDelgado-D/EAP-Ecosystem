import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { SegmentTargetKind, DomainNotificationType } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  mockLearningPathMembershipPort,
  mockNotificationPort,
  mockSessionRepository,
} from "../../mocks/index.js";
import { startSession } from "./start-session.js";
import { endSession, MIN_SESSION_DURATION_SEC } from "./end-session.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";

describe("endSession", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;
  let notificationPort: ReturnType<typeof mockNotificationPort>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    membershipPort = mockLearningPathMembershipPort();
    notificationPort = mockNotificationPort();
    requestingUserId = await cryptoService.generateUUID();
  });

  const deps = () => ({ sessionRepository, notificationPort });

  const startSessionStartedSecondsAgo = async (secondsAgo: number) => {
    const session = await startSession(
      {
        sessionRepository,
        cryptoService,
        learningPathMembershipPort: membershipPort,
      },
      {
        userId: requestingUserId,
        plannedMin: 25,
        target: { kind: SegmentTargetKind.FREE },
      },
    );
    if (session instanceof Error) throw session;

    const storedSession = sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.startedAt = new Date(Date.now() - secondsAgo * 1000);
    return session;
  };

  test("Should finalize a session that met the minimum duration and notify completion", async () => {
    const session = await startSessionStartedSecondsAgo(
      MIN_SESSION_DURATION_SEC + 60,
    );

    const result = await endSession(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
    });

    if (result instanceof Error) throw result;
    if (result.discarded) throw new Error("expected a finalized session");

    expect(result.session.completedAt).toBeDefined();
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.endSec).toBeDefined();

    expect(sessionRepository.sessions).toHaveLength(1);
    expect(notificationPort.notifications).toHaveLength(1);
    expect(notificationPort.notifications[0]!.type).toBe(
      DomainNotificationType.SESSION_COMPLETED,
    );
  });

  test("Should discard a session shorter than the minimum duration, without notifying", async () => {
    const session = await startSessionStartedSecondsAgo(
      MIN_SESSION_DURATION_SEC - 1,
    );

    const result = await endSession(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
    });

    expect(result).toEqual({ discarded: true });
    expect(sessionRepository.sessions).toHaveLength(0);
    expect(sessionRepository.segments).toHaveLength(0);
    expect(notificationPort.notifications).toHaveLength(0);
  });

  test("Should return InvalidDataError when sessionId is missing", async () => {
    const result = await endSession(deps(), {
      userId: requestingUserId,
    } as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await cryptoService.generateUUID();

    const result = await endSession(deps(), {
      userId: requestingUserId,
      sessionId: nonExistentSessionId,
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("Should return SessionForbiddenError when the session belongs to another user", async () => {
    const session = await startSessionStartedSecondsAgo(
      MIN_SESSION_DURATION_SEC + 60,
    );
    const otherUserId = await cryptoService.generateUUID();

    const result = await endSession(deps(), {
      userId: otherUserId,
      sessionId: session.id,
    });

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("Should return SessionNotActiveError when the session already ended", async () => {
    const session = await startSessionStartedSecondsAgo(
      MIN_SESSION_DURATION_SEC + 60,
    );
    const storedSession = sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.completedAt = new Date();

    const result = await endSession(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
    });

    expect(result).toBeInstanceOf(SessionNotActiveError);
  });

  test("Should return NoOpenSegmentError when the active session has no open segment", async () => {
    const session = await startSessionStartedSecondsAgo(
      MIN_SESSION_DURATION_SEC + 60,
    );
    const openSegment = await sessionRepository.findOpenSegmentBySessionId(
      session.id,
    );
    await sessionRepository.updateSegment({ ...openSegment!, endSec: 120 });

    const result = await endSession(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
    });

    expect(result).toBeInstanceOf(NoOpenSegmentError);
  });
});
