import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockCurrentUser } from "domain-lib";
import { mockSessionRepository } from "../../mocks/index.js";
import { verifySessionOwnership } from "./verify-session-ownership.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";

describe("verifySessionOwnership", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;

  beforeEach(() => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
  });

  test("should return SessionNotFoundError when the session does not exist", async () => {
    const currentUser = await mockCurrentUser(cryptoService);
    const nonExistentSessionId = await cryptoService.generateUUID();

    const result = await verifySessionOwnership(
      sessionRepository,
      nonExistentSessionId,
      currentUser,
    );

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("should return SessionForbiddenError when the session belongs to another user", async () => {
    const currentUser = await mockCurrentUser(cryptoService);
    const sessionOwnerId = await cryptoService.generateUUID();
    const otherUsersSession = await sessionRepository.save({
      id: await cryptoService.generateUUID(),
      userId: sessionOwnerId,
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await verifySessionOwnership(
      sessionRepository,
      otherUsersSession.id,
      currentUser,
    );

    expect(result).toBeInstanceOf(SessionForbiddenError);
  });

  test("should return the session when it exists and belongs to the user", async () => {
    const currentUser = await mockCurrentUser(cryptoService);
    const ownedSession = await sessionRepository.save({
      id: await cryptoService.generateUUID(),
      userId: currentUser.id,
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await verifySessionOwnership(
      sessionRepository,
      ownedSession.id,
      currentUser,
    );

    expect(result).toEqual(ownedSession);
  });
});
