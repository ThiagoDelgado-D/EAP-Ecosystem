import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockCurrentUser } from "domain-lib";
import { mockBreakRepository } from "../../mocks/index.js";
import { verifyBreakOwnership } from "./verify-break-ownership.js";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";

describe("verifyBreakOwnership", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let breakRepository: ReturnType<typeof mockBreakRepository>;

  beforeEach(() => {
    cryptoService = mockCryptoService();
    breakRepository = mockBreakRepository();
  });

  test("should return BreakNotFoundError when the break does not exist", async () => {
    const currentUser = await mockCurrentUser(cryptoService);
    const nonExistentBreakId = await cryptoService.generateUUID();

    const result = await verifyBreakOwnership(
      breakRepository,
      nonExistentBreakId,
      currentUser,
    );

    expect(result).toBeInstanceOf(BreakNotFoundError);
  });

  test("should return BreakForbiddenError when the break belongs to another user", async () => {
    const currentUser = await mockCurrentUser(cryptoService);
    const breakOwnerId = await cryptoService.generateUUID();
    const otherUsersBreak = await breakRepository.save({
      id: await cryptoService.generateUUID(),
      userId: breakOwnerId,
      startedAt: new Date(),
      durationSec: 300,
    });

    const result = await verifyBreakOwnership(
      breakRepository,
      otherUsersBreak.id,
      currentUser,
    );

    expect(result).toBeInstanceOf(BreakForbiddenError);
  });

  test("should return the break when it exists and belongs to the user", async () => {
    const currentUser = await mockCurrentUser(cryptoService);
    const ownedBreak = await breakRepository.save({
      id: await cryptoService.generateUUID(),
      userId: currentUser.id,
      startedAt: new Date(),
      durationSec: 300,
    });

    const result = await verifyBreakOwnership(
      breakRepository,
      ownedBreak.id,
      currentUser,
    );

    expect(result).toEqual(ownedBreak);
  });
});
