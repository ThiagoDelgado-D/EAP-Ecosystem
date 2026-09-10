import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { SegmentTargetKind } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { mockSessionRepository } from "../../mocks/index.js";
import { getLastSessionTarget } from "./get-last-session-target.js";

describe("getLastSessionTarget", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    requestingUserId = await cryptoService.generateUUID();
  });

  const deps = () => ({ sessionRepository });

  const addCompletedSession = async (secondsAgo: number) => {
    const sessionId = await cryptoService.generateUUID();

    sessionRepository.sessions.push({
      id: sessionId,
      userId: requestingUserId,
      startedAt: new Date(Date.now() - secondsAgo * 1000),
      completedAt: new Date(Date.now() - secondsAgo * 1000 + 25 * 60 * 1000),
      plannedMin: 25,
    });

    return sessionId;
  };

  test("Should return null when the user has no sessions", async () => {
    const result = await getLastSessionTarget(deps(), {
      userId: requestingUserId,
    });
    expect(result).toBeNull();
  });

  test("Should return null when the most recent session has no node segment", async () => {
    const sessionId = await addCompletedSession(3600);

    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId,
      startSec: 0,
      endSec: 1500,
      targetKind: SegmentTargetKind.FREE,
    });

    const result = await getLastSessionTarget(deps(), {
      userId: requestingUserId,
    });

    expect(result).toBeNull();
  });

  test("Should return the node segment's target from the most recent completed session", async () => {
    const sessionId = await addCompletedSession(3600);
    const learningPathId = await cryptoService.generateUUID();
    const learningPathNodeId = await cryptoService.generateUUID();
    const resourceId = await cryptoService.generateUUID();

    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId,
      startSec: 0,
      endSec: 1500,
      targetKind: SegmentTargetKind.NODE,
      learningPathId,
      learningPathNodeId,
      resourceId,
    });

    const result = await getLastSessionTarget(deps(), {
      userId: requestingUserId,
    });

    expect(result).toEqual({ learningPathId, learningPathNodeId, resourceId });
  });

  test("Should ignore the still-active session even when it is the most recent", async () => {
    const activeSessionId = await cryptoService.generateUUID();
    sessionRepository.sessions.push({
      id: activeSessionId,
      userId: requestingUserId,
      startedAt: new Date(),
      plannedMin: 25,
    });

    const completedSessionId = await addCompletedSession(7200);
    const learningPathId = await cryptoService.generateUUID();
    const learningPathNodeId = await cryptoService.generateUUID();

    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId: completedSessionId,
      startSec: 0,
      endSec: 1500,
      targetKind: SegmentTargetKind.NODE,
      learningPathId,
      learningPathNodeId,
    });

    const result = await getLastSessionTarget(deps(), {
      userId: requestingUserId,
    });

    expect(result).toEqual({
      learningPathId,
      learningPathNodeId,
      resourceId: undefined,
    });
  });

  test("Should return InvalidDataError when userId is missing", async () => {
    const result = await getLastSessionTarget(deps(), {} as never);
    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
