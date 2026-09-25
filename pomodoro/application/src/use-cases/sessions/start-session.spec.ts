import { BaseError, InvalidDataError, mockCryptoService, mockCurrentUser, type CurrentUser, type UUID } from "domain-lib";
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
import { SessionAlreadyActiveError } from "../../errors/session-already-active.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

describe("startSession", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;
  let currentUser: CurrentUser;
  let multiPathResourceId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    currentUser = await mockCurrentUser(cryptoService);
    multiPathResourceId = await cryptoService.generateUUID();

    const candidates: LearningPathMembership[] = [
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "First Path",
        nodeId: await cryptoService.generateUUID(),
      },
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "Second Path",
        nodeId: await cryptoService.generateUUID(),
      },
    ];
    membershipPort = mockLearningPathMembershipPort({
      [multiPathResourceId]: candidates,
    });
  });

  const deps = () => ({
    sessionRepository,
    cryptoService,
    learningPathMembershipPort: membershipPort,
    currentUser,
  });

  test("Should start a free session and create its first segment", async () => {
    const result = await startSession(deps(), {
      plannedMin: 25,
      target: { kind: SegmentTargetKind.FREE },
    });

    if (result instanceof BaseError) throw result;
    const session = result;
    expect(session.userId).toBe(currentUser.id);
    expect(session.plannedMin).toBe(25);
    expect(session.completedAt).toBeUndefined();

    const segments = sessionRepository.segments.filter(
      (s) => s.sessionId === session.id,
    );
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      targetKind: SegmentTargetKind.FREE,
      startSec: 0,
    });
    expect(segments[0]!.endSec).toBeUndefined();
  });

  test("Should return InvalidDataError when plannedMin is missing", async () => {
    const result = await startSession(deps(), {
      target: { kind: SegmentTargetKind.FREE },
    } as any);

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionAlreadyActiveError when the user already has an active session", async () => {
    await startSession(deps(), {
      plannedMin: 25,
      target: { kind: SegmentTargetKind.FREE },
    });

    const result = await startSession(deps(), {
      plannedMin: 50,
      target: { kind: SegmentTargetKind.FREE },
    });

    expect(result).toBeInstanceOf(SessionAlreadyActiveError);
  });

  test("Should return AmbiguousPathTargetError instead of guessing which path counts", async () => {
    const result = await startSession(deps(), {
      plannedMin: 25,
      target: {
        kind: SegmentTargetKind.RESOURCE,
        resourceId: multiPathResourceId,
      },
    });

    expect(result).toBeInstanceOf(AmbiguousPathTargetError);
    expect(sessionRepository.sessions).toHaveLength(0);
  });
});
