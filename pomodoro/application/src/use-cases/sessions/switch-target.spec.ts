import { InvalidDataError } from "domain-lib";
import { SegmentTargetKind } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { createSessionLifecycleFixture, type SessionLifecycleFixture } from "../../mocks/index.js";
import { switchTarget } from "./switch-target.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

describe("switchTarget", () => {
  let fixture: SessionLifecycleFixture;

  beforeEach(async () => {
    fixture = await createSessionLifecycleFixture();
  });

  const deps = () => ({
    sessionRepository: fixture.sessionRepository,
    cryptoService: fixture.cryptoService,
    learningPathMembershipPort: fixture.membershipPort,
  });

  test("Should close the open segment and open a new one for the resolved target", async () => {
    const session = await fixture.startFreeSession();
    const reactDocsResourceId = await fixture.cryptoService.generateUUID();

    const result = await switchTarget(deps(), {
      userId: fixture.requestingUserId,
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

    const segments = fixture.sessionRepository.segments.filter(
      (s) => s.sessionId === session.id,
    );
    expect(segments).toHaveLength(2);
  });

  test("Should return InvalidDataError when sessionId is missing", async () => {
    const result = await switchTarget(deps(), {
      userId: fixture.requestingUserId,
      target: { kind: SegmentTargetKind.FREE },
    } as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await fixture.cryptoService.generateUUID();

    const result = await switchTarget(deps(), {
      userId: fixture.requestingUserId,
      sessionId: nonExistentSessionId,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("Should return SessionForbiddenError when the session belongs to another user", async () => {
    const session = await fixture.startFreeSession();
    const otherUserId = await fixture.cryptoService.generateUUID();

    const result = await switchTarget(deps(), {
      userId: otherUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("Should return SessionNotActiveError when the session already ended", async () => {
    const session = await fixture.startFreeSession();
    const storedSession = fixture.sessionRepository.sessions.find(
      (s) => s.id === session.id,
    )!;
    storedSession.completedAt = new Date();

    const result = await switchTarget(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotActiveError);
  });

  test("Should return NoOpenSegmentError when the active session has no open segment", async () => {
    const session = await fixture.startFreeSession();
    const openSegment = await fixture.sessionRepository.findOpenSegmentBySessionId(
      session.id,
    );
    await fixture.sessionRepository.updateSegment({
      ...openSegment!,
      endSec: 120,
    });

    const result = await switchTarget(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(NoOpenSegmentError);
  });

  test("Should return NoOpenSegmentError before resolving the target, even when that target would also be ambiguous", async () => {
    const session = await fixture.startFreeSession();
    const openSegment = await fixture.sessionRepository.findOpenSegmentBySessionId(
      session.id,
    );
    await fixture.sessionRepository.updateSegment({
      ...openSegment!,
      endSec: 120,
    });

    const result = await switchTarget(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: {
        kind: SegmentTargetKind.RESOURCE,
        resourceId: fixture.cleanArchitectureResourceId,
      },
    });

    expect(result).toBeInstanceOf(NoOpenSegmentError);
  });

  test("Should return AmbiguousPathTargetError instead of guessing which path counts", async () => {
    const session = await fixture.startFreeSession();

    const result = await switchTarget(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: {
        kind: SegmentTargetKind.RESOURCE,
        resourceId: fixture.cleanArchitectureResourceId,
      },
    });

    expect(result).toBeInstanceOf(AmbiguousPathTargetError);

    const segments = fixture.sessionRepository.segments.filter(
      (s) => s.sessionId === session.id,
    );
    expect(segments).toHaveLength(1);
  });
});
