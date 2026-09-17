import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { SegmentTargetKind } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  mockNotificationPort,
  mockSessionRepository,
} from "../../mocks/index.js";
import { getActiveSession } from "./get-active-session.js";

describe("getActiveSession", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let notificationPort: ReturnType<typeof mockNotificationPort>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    notificationPort = mockNotificationPort();
    requestingUserId = await cryptoService.generateUUID();
  });

  const deps = () => ({ sessionRepository, notificationPort });

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

  test("should auto-close a session left open past plannedMin, capped exactly at the boundary", async () => {
    const sessionId = await cryptoService.generateUUID();
    const plannedMin = 25;
    const startedAt = new Date(Date.now() - (plannedMin * 60 + 3600) * 1000);
    sessionRepository.sessions.push({
      id: sessionId,
      userId: requestingUserId,
      startedAt,
      plannedMin,
    });
    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId,
      startSec: 0,
      targetKind: SegmentTargetKind.FREE,
    });

    const result = await getActiveSession(deps(), { userId: requestingUserId });

    const boundaryAt = new Date(startedAt.getTime() + plannedMin * 60 * 1000);
    expect(result).toEqual({
      autoClosed: true,
      session: {
        id: sessionId,
        userId: requestingUserId,
        startedAt,
        plannedMin,
        completedAt: boundaryAt,
        autoCompleted: true,
      },
      segments: [
        {
          id: sessionRepository.segments[0]!.id,
          sessionId,
          startSec: 0,
          endSec: plannedMin * 60,
          targetKind: SegmentTargetKind.FREE,
        },
      ],
    });
    expect(notificationPort.notifications).toHaveLength(1);
  });

  test("should not auto-close a session still within its plannedMin", async () => {
    const sessionId = await cryptoService.generateUUID();
    const plannedMin = 25;
    sessionRepository.sessions.push({
      id: sessionId,
      userId: requestingUserId,
      startedAt: new Date(Date.now() - 60 * 1000),
      plannedMin,
    });

    const result = await getActiveSession(deps(), { userId: requestingUserId });

    expect(result).not.toBeNull();
    expect(result && "autoClosed" in result).toBe(false);
    expect(notificationPort.notifications).toHaveLength(0);
  });
});
