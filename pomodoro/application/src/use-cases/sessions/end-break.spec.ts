import { beforeEach, describe, expect, test } from "vitest";
import { BaseError, mockCryptoService, type UUID } from "domain-lib";
import { mockBreakRepository, mockNotificationPort } from "../../mocks/index.js";
import { startBreak } from "./start-break.js";
import { endBreak } from "./end-break.js";
import { getActiveBreak } from "./get-active-break.js";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";
import { BreakNotActiveError } from "../../errors/break-not-active.js";

describe("endBreak", () => {
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

  test("should set endedAt and clear the active break", async () => {
    const activeBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );
    if (activeBreak instanceof BaseError) throw activeBreak;

    const result = await endBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: activeBreak.id },
    );
    if (result instanceof BaseError) throw result;

    expect(result.id).toBe(activeBreak.id);
    expect(result.endedAt).toBeInstanceOf(Date);

    const activeAfterEnd = await getActiveBreak(
      { breakRepository },
      { userId: requestingUserId },
    );
    expect(activeAfterEnd).toBeNull();
  });

  test("should return BreakNotFoundError when the break does not exist", async () => {
    const nonExistentBreakId = await cryptoService.generateUUID();

    const result = await endBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: nonExistentBreakId },
    );

    expect(result).toBeInstanceOf(BreakNotFoundError);
  });

  test("should return BreakForbiddenError when the break belongs to another user", async () => {
    const activeBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );
    if (activeBreak instanceof BaseError) throw activeBreak;
    const intruderId = await cryptoService.generateUUID();

    const result = await endBreak(
      { breakRepository },
      { userId: intruderId, breakId: activeBreak.id },
    );

    expect(result).toBeInstanceOf(BreakForbiddenError);
  });

  test("should return BreakNotActiveError when the break already ended", async () => {
    const activeBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );
    if (activeBreak instanceof BaseError) throw activeBreak;
    await endBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: activeBreak.id },
    );

    const result = await endBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: activeBreak.id },
    );

    expect(result).toBeInstanceOf(BreakNotActiveError);
  });
});
