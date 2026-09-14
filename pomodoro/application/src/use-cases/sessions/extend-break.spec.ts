import { beforeEach, describe, expect, test } from "vitest";
import { BaseError, mockCryptoService, type UUID } from "domain-lib";
import {
  mockBreakRepository,
  mockNotificationPort,
} from "../../mocks/index.js";
import { startBreak } from "./start-break.js";
import { extendBreak } from "./extend-break.js";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";
import { BreakNotActiveError } from "../../errors/break-not-active.js";

describe("extendBreak", () => {
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

  test("should add the given seconds to the break's durationSec", async () => {
    const activeBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );

    if (activeBreak instanceof BaseError) throw activeBreak;

    const result = await extendBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: activeBreak.id, seconds: 60 },
    );

    if (result instanceof BaseError) throw result;

    expect(result).toMatchObject({
      id: activeBreak.id,
      durationSec: activeBreak.durationSec + 60,
    });
  });

  test("should return BreakNotFoundError when the break does not exist", async () => {
    const nonExistentBreakId = await cryptoService.generateUUID();

    const result = await extendBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: nonExistentBreakId, seconds: 60 },
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

    const result = await extendBreak(
      { breakRepository },
      { userId: intruderId, breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakForbiddenError);
  });

  test("should return BreakNotActiveError when the break already ended", async () => {
    const activeBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );

    if (activeBreak instanceof BaseError) throw activeBreak;
    await breakRepository.update({ ...activeBreak, endedAt: new Date() });

    const result = await extendBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakNotActiveError);
  });
});
