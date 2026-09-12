import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import {
  SegmentTargetKind,
  type LearningPathMembership,
} from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  mockLearningPathMembershipPort,
  mockSessionRepository,
} from "../../mocks/index.js";
import { startSession } from "./start-session.js";
import { attachOpenSegment } from "./attach-open-segment.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

describe("attachOpenSegment", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;
  let requestingUserId: UUID;
  let cleanArchitectureResourceId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    requestingUserId = await cryptoService.generateUUID();
    cleanArchitectureResourceId = await cryptoService.generateUUID();

    const pathsSharingCleanArchitecture: LearningPathMembership[] = [
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "Frontend Architecture Mastery",
        nodeId: await cryptoService.generateUUID(),
      },
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "System Design Prep",
        nodeId: await cryptoService.generateUUID(),
      },
    ];
    membershipPort = mockLearningPathMembershipPort({
      [cleanArchitectureResourceId]: pathsSharingCleanArchitecture,
    });
  });

  const deps = () => ({
    sessionRepository,
    learningPathMembershipPort: membershipPort,
  });

  const startFreeSession = async () => {
    const session = await startSession(
      { sessionRepository, cryptoService, learningPathMembershipPort: membershipPort },
      { userId: requestingUserId, plannedMin: 25, target: { kind: SegmentTargetKind.FREE } },
    );
    return session as Exclude<typeof session, Error>;
  };

  test("Should retarget the open segment in place, without closing or opening a new one", async () => {
    const session = await startFreeSession();
    const reactDocsResourceId = await cryptoService.generateUUID();
    const openSegmentBefore = await sessionRepository.findOpenSegmentBySessionId(session.id);

    const result = await attachOpenSegment(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.RESOURCE, resourceId: reactDocsResourceId },
    });

    expect(result).not.toBeInstanceOf(Error);
    const { segment } = result as Exclude<typeof result, Error>;

    expect(segment.id).toBe(openSegmentBefore!.id);
    expect(segment.startSec).toBe(openSegmentBefore!.startSec);
    expect(segment.endSec).toBeUndefined();
    expect(segment.targetKind).toBe(SegmentTargetKind.RESOURCE);

    const segments = sessionRepository.segments.filter((s) => s.sessionId === session.id);
    expect(segments).toHaveLength(1);
  });

  test("Should return InvalidDataError when sessionId is missing", async () => {
    const result = await attachOpenSegment(deps(), {
      userId: requestingUserId,
      target: { kind: SegmentTargetKind.FREE },
    } as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await cryptoService.generateUUID();

    const result = await attachOpenSegment(deps(), {
      userId: requestingUserId,
      sessionId: nonExistentSessionId,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("Should return SessionForbiddenError when the session belongs to another user", async () => {
    const session = await startFreeSession();
    const otherUserId = await cryptoService.generateUUID();

    const result = await attachOpenSegment(deps(), {
      userId: otherUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("Should return SessionNotActiveError when the session already ended", async () => {
    const session = await startFreeSession();
    const storedSession = sessionRepository.sessions.find((s) => s.id === session.id)!;
    storedSession.completedAt = new Date();

    const result = await attachOpenSegment(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionNotActiveError);
  });

  test("Should return NoOpenSegmentError when the active session has no open segment", async () => {
    const session = await startFreeSession();
    const openSegment = await sessionRepository.findOpenSegmentBySessionId(session.id);
    await sessionRepository.updateSegment({ ...openSegment!, endSec: 120 });

    const result = await attachOpenSegment(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(NoOpenSegmentError);
  });

  test("Should return AmbiguousPathTargetError instead of guessing which path counts", async () => {
    const session = await startFreeSession();

    const result = await attachOpenSegment(deps(), {
      userId: requestingUserId,
      sessionId: session.id,
      target: { kind: SegmentTargetKind.RESOURCE, resourceId: cleanArchitectureResourceId },
    });

    expect(result).toBeInstanceOf(AmbiguousPathTargetError);

    const segments = sessionRepository.segments.filter((s) => s.sessionId === session.id);
    expect(segments[0]!.targetKind).toBe(SegmentTargetKind.FREE);
  });
});
