import { BaseError, InvalidDataError } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { createSessionLifecycleFixture, type SessionLifecycleFixture } from "../../mocks/index.js";
import { SegmentTargetKind } from "@pomodoro/domain";
import { attributeSession } from "./attribute-session.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotCompletedError } from "../../errors/session-not-completed.js";
import { SegmentsAlreadyAttributedError } from "../../errors/segments-already-attributed.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

describe("attributeSession", () => {
  let fixture: SessionLifecycleFixture;

  beforeEach(async () => {
    fixture = await createSessionLifecycleFixture();
  });

  const deps = () => ({
    sessionRepository: fixture.sessionRepository,
    learningPathMembershipPort: fixture.membershipPort,
  });

  async function completeFreeSession() {
    const session = await fixture.startFreeSession();
    const openSegment = await fixture.sessionRepository.findOpenSegmentBySessionId(session.id);
    await fixture.sessionRepository.updateSegment({ ...openSegment!, endSec: 1500 });
    const storedSession = fixture.sessionRepository.sessions.find((s) => s.id === session.id)!;
    storedSession.completedAt = new Date();
    return session;
  }

  test("Should attribute every loose segment of a completed session to the given target", async () => {
    const session = await completeFreeSession();
    const reactDocsResourceId = await fixture.cryptoService.generateUUID();
    const segmentBefore = (await fixture.sessionRepository.findSegmentsBySessionId(session.id))[0]!;

    const result = await attributeSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.RESOURCE, resourceId: reactDocsResourceId },
    });

    if (result instanceof BaseError) throw result;
    const { segments } = result;

    expect(segments).toHaveLength(1);
    expect(segments[0]!.id).toBe(segmentBefore.id);
    expect(segments[0]!.startSec).toBe(segmentBefore.startSec);
    expect(segments[0]!.endSec).toBe(segmentBefore.endSec);
    expect(segments[0]!.targetKind).toBe(SegmentTargetKind.RESOURCE);
  });

  test("Should return InvalidDataError when sessionId is missing", async () => {
    const result = await attributeSession(deps(), {
      userId: fixture.requestingUserId,
      target: { kind: SegmentTargetKind.FREE },
    } as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await fixture.cryptoService.generateUUID();

    const result = await attributeSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: nonExistentSessionId,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("Should return SessionForbiddenError when the session belongs to another user", async () => {
    const session = await completeFreeSession();
    const otherUserId = await fixture.cryptoService.generateUUID();

    const result = await attributeSession(deps(), {
      userId: otherUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("Should return SessionNotCompletedError when the session is still active", async () => {
    const session = await fixture.startFreeSession();

    const result = await attributeSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotCompletedError);
  });

  test("Should return SegmentsAlreadyAttributedError when a segment already has a target", async () => {
    const session = await completeFreeSession();
    const resourceId = await fixture.cryptoService.generateUUID();
    const segment = (await fixture.sessionRepository.findSegmentsBySessionId(session.id))[0]!;
    await fixture.sessionRepository.updateSegment({
      ...segment,
      targetKind: SegmentTargetKind.RESOURCE,
      resourceId,
    });

    const result = await attributeSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.RESOURCE, resourceId: await fixture.cryptoService.generateUUID() },
    });

    expect(result).toBeInstanceOf(SegmentsAlreadyAttributedError);
  });

  test("Should return AmbiguousPathTargetError instead of guessing which path counts, leaving segments untouched", async () => {
    const session = await completeFreeSession();

    const result = await attributeSession(deps(), {
      userId: fixture.requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.RESOURCE, resourceId: fixture.cleanArchitectureResourceId },
    });

    expect(result).toBeInstanceOf(AmbiguousPathTargetError);

    const segments = await fixture.sessionRepository.findSegmentsBySessionId(session.id);
    expect(segments[0]!.targetKind).toBe(SegmentTargetKind.FREE);
  });
});
