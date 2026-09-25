import { BaseError, mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { DomainNotificationType } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  mockBreakRepository,
  mockNotificationPort,
  mockSessionRepository,
} from "../../mocks/index.js";
import { BreakAlreadyActiveError } from "../../errors/break-already-active.js";
import { SessionStillActiveError } from "../../errors/session-still-active.js";
import { DEFAULT_BREAK_DURATION_SEC, startBreak } from "./start-break.js";

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

  test("Should return SessionStillActiveError when the user has an active focus session", async () => {
    const activeSessionId = await cryptoService.generateUUID();
    sessionRepository.sessions.push({
      id: activeSessionId,
      userId: currentUser.id,
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await startBreak(deps());

    expect(result).toBeInstanceOf(SessionStillActiveError);
    if (!(result instanceof SessionStillActiveError)) throw result;
    expect(result.context).toEqual({ activeSessionId });
    expect(breakRepository.breaks).toHaveLength(0);
  });
});
