import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { SegmentTargetKind } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { mockSessionRepository } from "../../mocks/index.js";
import { getPathMomentum } from "./get-path-momentum.js";

describe("getPathMomentum", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    requestingUserId = await cryptoService.generateUUID();
  });

  const deps = () => ({ sessionRepository });

  const addSession = async (daysAgo: number) => {
    const sessionId = await cryptoService.generateUUID();
    sessionRepository.sessions.push({
      id: sessionId,
      userId: requestingUserId,
      startedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      plannedMin: 25,
    });
    return sessionId;
  };

  const addNodeSegment = async (
    sessionId: UUID,
    learningPathId: UUID,
    startSec: number,
    endSec: number | undefined,
  ) => {
    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId,
      startSec,
      endSec,
      targetKind: SegmentTargetKind.NODE,
      learningPathId,
      learningPathNodeId: await cryptoService.generateUUID(),
    });
  };

  test("Should return an empty array when there are no segments in the window", async () => {
    const result = await getPathMomentum(deps(), { userId: requestingUserId });
    expect(result).toEqual([]);
  });

  test("Should sum seconds per path across multiple sessions", async () => {
    const sharedPathId = await cryptoService.generateUUID();
    const yesterdaySessionId = await addSession(1);
    const twoDaysAgoSessionId = await addSession(2);

    await addNodeSegment(yesterdaySessionId, sharedPathId, 0, 1500);
    await addNodeSegment(twoDaysAgoSessionId, sharedPathId, 0, 900);

    const result = await getPathMomentum(deps(), { userId: requestingUserId });
    expect(result).toEqual([{ learningPathId: sharedPathId, totalSeconds: 2400 }]);
  });

  test("Should ignore free segments", async () => {
    const sessionId = await addSession(1);

    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId,
      startSec: 0,
      endSec: 1500,
      targetKind: SegmentTargetKind.FREE,
    });

    const result = await getPathMomentum(deps(), { userId: requestingUserId });
    expect(result).toEqual([]);
  });

  test("Should ignore a segment that is still open", async () => {
    const openSegmentPathId = await cryptoService.generateUUID();
    const sessionId = await addSession(1);
    await addNodeSegment(sessionId, openSegmentPathId, 0, undefined);

    const result = await getPathMomentum(deps(), { userId: requestingUserId });
    expect(result).toEqual([]);
  });

  test("Should exclude sessions started before the window", async () => {
    const outOfWindowPathId = await cryptoService.generateUUID();
    const outOfWindowSessionId = await addSession(30);
    await addNodeSegment(outOfWindowSessionId, outOfWindowPathId, 0, 1500);

    const result = await getPathMomentum(deps(), {
      userId: requestingUserId,
      days: 7,
    });

    expect(result).toEqual([]);
  });

  test("Should sort paths by total seconds descending", async () => {
    const busyPathId = await cryptoService.generateUUID();
    const quietPathId = await cryptoService.generateUUID();
    const sessionId = await addSession(1);

    await addNodeSegment(sessionId, quietPathId, 0, 300);
    await addNodeSegment(sessionId, busyPathId, 300, 2100);

    const result = await getPathMomentum(deps(), { userId: requestingUserId });

    expect(result).toEqual([
      { learningPathId: busyPathId, totalSeconds: 1800 },
      { learningPathId: quietPathId, totalSeconds: 300 },
    ]);
  });

  test("Should return InvalidDataError when days is not positive", async () => {
    const result = await getPathMomentum(deps(), {
      userId: requestingUserId,
      days: -1,
    });
    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
