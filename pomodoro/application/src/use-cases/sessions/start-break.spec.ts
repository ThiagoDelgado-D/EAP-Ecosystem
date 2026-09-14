import { mockCryptoService, type UUID } from "domain-lib";
import { DomainNotificationType } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  mockBreakRepository,
  mockNotificationPort,
} from "../../mocks/index.js";
import { BreakAlreadyActiveError } from "../../errors/break-already-active.js";
import { DEFAULT_BREAK_DURATION_SEC, startBreak } from "./start-break.js";

describe("startBreak", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let breakRepository: ReturnType<typeof mockBreakRepository>;
  let notificationPort: ReturnType<typeof mockNotificationPort>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    breakRepository = mockBreakRepository();
    notificationPort = mockNotificationPort();
    requestingUserId = await cryptoService.generateUUID();
  });

  test("Should persist a break with the default duration", async () => {
    const result = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );

    expect(result).toMatchObject({
      userId: requestingUserId,
      durationSec: DEFAULT_BREAK_DURATION_SEC,
    });
    expect(breakRepository.breaks).toHaveLength(1);
  });

  test("Should notify that a break started with the default duration", async () => {
    await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );

    expect(notificationPort.notifications).toHaveLength(1);
    const [notification] = notificationPort.notifications;
    expect(notification!.type).toBe(DomainNotificationType.BREAK_STARTED);
    expect(notification!.body).toContain(`${DEFAULT_BREAK_DURATION_SEC / 60}`);
  });

  test("Should return BreakAlreadyActiveError when the user already has an active break", async () => {
    const activeBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );

    const result = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );

    expect(result).toBeInstanceOf(BreakAlreadyActiveError);
    expect((result as BreakAlreadyActiveError).context).toEqual({
      activeBreakId: (activeBreak as { id: UUID }).id,
    });
  });
});
