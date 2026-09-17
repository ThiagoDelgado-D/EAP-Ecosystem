import { BaseError, InvalidDataError } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { createSessionLifecycleFixture, type SessionLifecycleFixture } from "../../mocks/index.js";
import { SegmentTargetKind } from "@pomodoro/domain";
import { attachOpenSegment } from "./attach-open-segment.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

describe("attachOpenSegment", () => {
  let fixture: SessionLifecycleFixture;

  beforeEach(async () => {
    fixture = await createSessionLifecycleFixture();
  });

  const deps = () => ({
    sessionRepository: fixture.sessionRepository,
    learningPathMembershipPort: fixture.membershipPort,
  });

  test("Should retarget the open segment in place, without closing or opening a new one", async () => {
    const session = await fixture.startFreeSession();
    const reactDocsResourceId = await fixture.cryptoService.generateUUID();
    const openSegmentBefore = await fixture.sessionRepository.findOpenSegmentBySessionId(session.id);

    const result = await attachOpenSegment(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.RESOURCE, resourceId: reactDocsResourceId },
    });

    if (result instanceof BaseError) throw result;
    const { segment } = result;

    expect(segment.id).toBe(openSegmentBefore!.id);
    expect(segment.startSec).toBe(openSegmentBefore!.startSec);
    expect(segment.endSec).toBeUndefined();
    expect(segment.targetKind).toBe(SegmentTargetKind.RESOURCE);

    const segments = fixture.sessionRepository.segments.filter((s) => s.sessionId === session.id);
    expect(segments).toHaveLength(1);
  });

  test("Should return InvalidDataError when sessionId is missing", async () => {
    const result = await attachOpenSegment(deps(), {
      userId: fixture.requestingUserId,
      target: { kind: SegmentTargetKind.FREE },
    } as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await fixture.cryptoService.generateUUID();

    const result = await attachOpenSegment(deps(), {
      userId: fixture.requestingUserId,
      sessionId: nonExistentSessionId,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("Should return SessionForbiddenError when the session belongs to another user", async () => {
    const session = await fixture.startFreeSession();
    const otherUserId = await fixture.cryptoService.generateUUID();

    const result = await attachOpenSegment(deps(), {
      userId: otherUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("Should return SessionNotActiveError when the session already ended", async () => {
    const session = await fixture.startFreeSession();
    const storedSession = fixture.sessionRepository.sessions.find((s) => s.id === session.id)!;
    storedSession.completedAt = new Date();

    const result = await attachOpenSegment(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotActiveError);
  });

  test("Should return NoOpenSegmentError when the active session has no open segment", async () => {
    const session = await fixture.startFreeSession();
    const openSegment = await fixture.sessionRepository.findOpenSegmentBySessionId(session.id);
    await fixture.sessionRepository.updateSegment({ ...openSegment!, endSec: 120 });

    const result = await attachOpenSegment(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(NoOpenSegmentError);
  });

  test("Should return AmbiguousPathTargetError instead of guessing which path counts", async () => {
    const session = await fixture.startFreeSession();

    const result = await attachOpenSegment(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.RESOURCE, resourceId: fixture.cleanArchitectureResourceId },
    });

    expect(result).toBeInstanceOf(AmbiguousPathTargetError);

    const segments = fixture.sessionRepository.segments.filter((s) => s.sessionId === session.id);
    expect(segments[0]!.targetKind).toBe(SegmentTargetKind.FREE);
  });
});
