import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
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
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    breakRepository = mockBreakRepository();
    notificationPort = mockNotificationPort();
    currentUser = await mockCurrentUser(cryptoService);
  });

  test("should return null when the user has no active break", async () => {
    const result = await getActiveBreak({ breakRepository, currentUser });

    expect(result).toBeNull();
  });

  test("should return the user's active break", async () => {
    const startedBreak = await startBreak({
      breakRepository,
      cryptoService,
      notificationPort,
      currentUser,
    });

    const result = await getActiveBreak({ breakRepository, currentUser });

    expect(result).toEqual(startedBreak);
  });

  test("should not return another user's active break", async () => {
    await startBreak({ breakRepository, cryptoService, notificationPort, currentUser });
    const intruder = await mockCurrentUser(cryptoService);

    const result = await getActiveBreak({ breakRepository, currentUser: intruder });

    expect(result).toBeNull();
  });
});
