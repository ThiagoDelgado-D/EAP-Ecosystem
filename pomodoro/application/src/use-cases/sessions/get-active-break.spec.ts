import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, type UUID } from "domain-lib";
import {
  mockBreakRepository,
  mockNotificationPort,
} from "../../mocks/index.js";
import { startBreak } from "./start-break.js";
import { getActiveBreak } from "./get-active-break.js";

describe("getActiveBreak", () => {
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

  test("should return null when the user has no active break", async () => {
    const result = await getActiveBreak(
      { breakRepository },
      { userId: requestingUserId },
    );

    expect(result).toBeNull();
  });

  test("should return the user's active break", async () => {
    const startedBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );

    const result = await getActiveBreak(
      { breakRepository },
      { userId: requestingUserId },
    );

    expect(result).toEqual(startedBreak);
  });

  test("should not return another user's active break", async () => {
    await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );
    const intruderId = await cryptoService.generateUUID();

    const result = await getActiveBreak(
      { breakRepository },
      { userId: intruderId },
    );

    expect(result).toBeNull();
  });
});
