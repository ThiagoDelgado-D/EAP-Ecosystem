import { BaseError, mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { DomainNotificationType } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  mockBreakRepository,
  mockNotificationPort,
  mockSessionRepository,
  seedBreak,
  seedSegment,
  seedSession,
} from "../../mocks/index.js";
import { BreakAlreadyActiveError } from "../../errors/break-already-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { MIN_SESSION_DURATION_SEC } from "./end-session.js";
import { DEFAULT_BREAK_DURATION_SEC, startBreak } from "./start-break.js";

const PLANNED_MIN = 25;

describe("startBreak", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let breakRepository: ReturnType<typeof mockBreakRepository>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let notificationPort: ReturnType<typeof mockNotificationPort>;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    breakRepository = mockBreakRepository();
    sessionRepository = mockSessionRepository();
    notificationPort = mockNotificationPort();
    currentUser = await mockCurrentUser(cryptoService);
  });

  const deps = () => ({
    breakRepository,
    sessionRepository,
    cryptoService,
    notificationPort,
    currentUser,
  });

  test("Should persist a break with the default duration", async () => {
    const result = await startBreak(deps());

    expect(result).toMatchObject({
      userId: currentUser.id,
      durationSec: DEFAULT_BREAK_DURATION_SEC,
    });
    expect(breakRepository.breaks).toHaveLength(1);
  });

  test("Should notify that a break started with the default duration", async () => {
    await startBreak(deps());

    expect(notificationPort.notifications).toHaveLength(1);
    const [notification] = notificationPort.notifications;
    expect(notification!.type).toBe(DomainNotificationType.BREAK_STARTED);
    expect(notification!.body).toContain(`${DEFAULT_BREAK_DURATION_SEC / 60}`);
  });

  test("Should return BreakAlreadyActiveError when the user already has an active break", async () => {
    const activeBreak = await startBreak(deps());
    if (activeBreak instanceof BaseError) throw activeBreak;

    const result = await startBreak(deps());

    expect(result).toBeInstanceOf(BreakAlreadyActiveError);
    if (!(result instanceof BreakAlreadyActiveError)) throw result;
    expect(result.context).toEqual({ activeBreakId: activeBreak.id });
  });

  const seedActiveSessionStartedSecondsAgo = (secondsAgo: number, withOpenSegment = true) => {
    const session = seedSession(sessionRepository, {
      userId: currentUser.id,
      startedAt: new Date(Date.now() - secondsAgo * 1000),
      plannedMin: PLANNED_MIN,
    });
    if (withOpenSegment) seedSegment(sessionRepository, { sessionId: session.id });
    return session;
  };

  test("Should end the active focus session before starting the break", async () => {
    const session = seedActiveSessionStartedSecondsAgo(MIN_SESSION_DURATION_SEC + 60);

    const result = await startBreak(deps());

    if (result instanceof BaseError) throw result;
    expect(sessionRepository.sessions.find((s) => s.id === session.id)?.completedAt).toBeDefined();
    expect(sessionRepository.segments[0]!.endSec).toBeDefined();
    expect(breakRepository.breaks).toHaveLength(1);
    expect(notificationPort.notifications.map((n) => n.type)).toEqual([
      DomainNotificationType.SESSION_COMPLETED,
      DomainNotificationType.BREAK_STARTED,
    ]);
  });

  test("Should discard an active session shorter than the minimum and still start the break", async () => {
    const session = seedActiveSessionStartedSecondsAgo(MIN_SESSION_DURATION_SEC - 1);

    const result = await startBreak(deps());

    if (result instanceof BaseError) throw result;
    expect(sessionRepository.sessions.some((s) => s.id === session.id)).toBe(false);
    expect(breakRepository.breaks).toHaveLength(1);
  });

  test("Should leave the active session open when a break is already active", async () => {
    const session = seedActiveSessionStartedSecondsAgo(MIN_SESSION_DURATION_SEC + 60);
    seedBreak(breakRepository, { userId: currentUser.id });

    const result = await startBreak(deps());

    expect(result).toBeInstanceOf(BreakAlreadyActiveError);
    expect(sessionRepository.sessions.find((s) => s.id === session.id)?.completedAt).toBeUndefined();
  });

  test("Should return NoOpenSegmentError and start no break when the active session has no open segment", async () => {
    const session = seedActiveSessionStartedSecondsAgo(MIN_SESSION_DURATION_SEC + 60, false);

    const result = await startBreak(deps());

    expect(result).toBeInstanceOf(NoOpenSegmentError);
    if (!(result instanceof NoOpenSegmentError)) throw result;
    expect(result.context).toEqual({ sessionId: session.id });
    expect(breakRepository.breaks).toHaveLength(0);
  });
});
