import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { SegmentTargetKind } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { mockSessionRepository } from "../../mocks/index.js";
import { getActiveSession } from "./get-active-session.js";

describe("getActiveSession", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    requestingUserId = await cryptoService.generateUUID();
  });

  const deps = () => ({ sessionRepository });

  test("should return null when the user has no active session", async () => {
    const result = await getActiveSession(deps(), { userId: requestingUserId });
    expect(result).toBeNull();
  });

  test("should return null when the user's most recent session is already completed", async () => {
    sessionRepository.sessions.push({
      id: await cryptoService.generateUUID(),
      userId: requestingUserId,
      startedAt: new Date(Date.now() - 3600 * 1000),
      completedAt: new Date(),
      plannedMin: 25,
    });

    const result = await getActiveSession(deps(), { userId: requestingUserId });

    expect(result).toBeNull();
  });

  test("should return the active session with its segments", async () => {
    const sessionId = await cryptoService.generateUUID();
    const learningPathId = await cryptoService.generateUUID();
    const learningPathNodeId = await cryptoService.generateUUID();
    const session = {
      id: sessionId,
      userId: requestingUserId,
      startedAt: new Date(),
      intent: "Finish the current chapter",
      plannedMin: 25,
    };
    sessionRepository.sessions.push(session);
    sessionRepository.segments.push(
      {
        id: await cryptoService.generateUUID(),
        sessionId,
        startSec: 0,
        endSec: 300,
        targetKind: SegmentTargetKind.FREE,
      },
      {
        id: await cryptoService.generateUUID(),
        sessionId,
        startSec: 300,
        targetKind: SegmentTargetKind.NODE,
        learningPathId,
        learningPathNodeId,
      },
    );

    const result = await getActiveSession(deps(), { userId: requestingUserId });

    expect(result).toEqual({ session, segments: sessionRepository.segments });
  });

  test("should not return another user's active session", async () => {
    const otherUserId = await cryptoService.generateUUID();
    sessionRepository.sessions.push({
      id: await cryptoService.generateUUID(),
      userId: otherUserId,
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await getActiveSession(deps(), { userId: requestingUserId });

    expect(result).toBeNull();
  });

  test("should return InvalidDataError when userId is missing", async () => {
    const result = await getActiveSession(deps(), {} as never);
    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
