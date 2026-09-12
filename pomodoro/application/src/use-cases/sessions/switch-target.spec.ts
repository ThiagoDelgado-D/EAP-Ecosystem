import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { SegmentTargetKind } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningPathMembershipPort, mockSessionRepository } from "../../mocks/index.js";
import { createSessionLifecycleFixture, type SessionLifecycleFixture } from "./session-lifecycle-fixture.js";
import { switchTarget } from "./switch-target.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

describe("switchTarget", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;
  let requestingUserId: UUID;
  let cleanArchitectureResourceId: UUID;
  let startFreeSession: SessionLifecycleFixture["startFreeSession"];

  beforeEach(async () => {
    ({
      cryptoService,
      sessionRepository,
      membershipPort,
      requestingUserId,
      cleanArchitectureResourceId,
      startFreeSession,
    } = await createSessionLifecycleFixture());
  });

  const deps = () => ({
    sessionRepository,
    cryptoService,
    learningPathMembershipPort: membershipPort,
  });

  test("Should close the open segment and open a new one for the resolved target", async () => {
    const session = await startFreeSession();
    const reactDocsResourceId = await cryptoService.generateUUID();

    const result = await switchTarget(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: {
        kind: SegmentTargetKind.RESOURCE,
        resourceId: reactDocsResourceId,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    const { closedSegment, openedSegment } = result as Exclude<
      typeof result,
      Error
    >;

    expect(closedSegment.endSec).toBeDefined();
    expect(closedSegment.targetKind).toBe(SegmentTargetKind.FREE);

    expect(openedSegment.startSec).toBe(closedSegment.endSec);
    expect(openedSegment.endSec).toBeUndefined();
    expect(openedSegment.targetKind).toBe(SegmentTargetKind.RESOURCE);
    expect(openedSegment.id).not.toBe(closedSegment.id);

    const segments = sessionRepository.segments.filter(
      (s) => s.sessionId === session.id,
    );
    expect(segments).toHaveLength(2);
  });

  test("Should return InvalidDataError when sessionId is missing", async () => {
    const result = await switchTarget(deps(), {
      userId: requestingUserId,
      target: { kind: SegmentTargetKind.FREE },
    } as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await cryptoService.generateUUID();

    const result = await switchTarget(deps(), {
      userId: requestingUserId,
      sessionId: nonExistentSessionId,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("Should return SessionForbiddenError when the session belongs to another user", async () => {
    const session = await startFreeSession();
    const otherUserId = await cryptoService.generateUUID();

    const result = await switchTarget(deps(), {
      userId: otherUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("Should return SessionNotActiveError when the session already ended", async () => {
    const session = await startFreeSession();
    const storedSession = sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.completedAt = new Date();

    const result = await switchTarget(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotActiveError);
  });

  test("Should return NoOpenSegmentError when the active session has no open segment", async () => {
    const session = await startFreeSession();
    const openSegment = await sessionRepository.findOpenSegmentBySessionId(
      session.id,
    );
    await sessionRepository.updateSegment({
      ...openSegment!,
      endSec: 120,
    });

    const result = await switchTarget(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(NoOpenSegmentError);
  });

  test("Should return AmbiguousPathTargetError instead of guessing which path counts", async () => {
    const session = await startFreeSession();

    const result = await switchTarget(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: {
        kind: SegmentTargetKind.RESOURCE,
        resourceId: cleanArchitectureResourceId,
      },
    });

    expect(result).toBeInstanceOf(AmbiguousPathTargetError);

    const segments = sessionRepository.segments.filter(
      (s) => s.sessionId === session.id,
    );
    expect(segments).toHaveLength(1);
  });
});
