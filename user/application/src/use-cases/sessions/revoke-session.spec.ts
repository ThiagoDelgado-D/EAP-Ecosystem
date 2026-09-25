import { beforeEach, describe, expect, test } from "vitest";
import { ForbiddenError, InvalidDataError, mockCryptoService } from "domain-lib";
import type { Session } from "@user/domain";
import { mockSessionRepository } from "../../mocks/mock-session-repository.js";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { revokeSession } from "./revoke-session.js";

describe("revokeSession", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let ownerId: string;
  let intruderId: string;
  let ownedSession: Session;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    ownerId = await cryptoService.generateUUID();
    intruderId = await cryptoService.generateUUID();

    ownedSession = {
      id: await cryptoService.generateUUID(),
      userId: ownerId,
      refreshTokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    };
    sessionRepository = mockSessionRepository([ownedSession]);
  });

  test("Should revoke the session when it belongs to the caller", async () => {
    const result = await revokeSession(
      { sessionRepository },
      { userId: ownerId, sessionId: ownedSession.id },
    );

    expect(result).toBeUndefined();
    const revoked = await sessionRepository.findById(ownedSession.id);
    expect(revoked?.revokedAt).toBeDefined();
  });

  test("Should return InvalidDataError when sessionId is not a valid UUID", async () => {
    const result = await revokeSession(
      { sessionRepository },
      { userId: ownerId, sessionId: "not-a-uuid" },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return SessionNotFoundError when the session does not exist", async () => {
    const nonExistentSessionId = await cryptoService.generateUUID();

    const result = await revokeSession(
      { sessionRepository },
      { userId: ownerId, sessionId: nonExistentSessionId },
    );

    expect(result).toBeInstanceOf(SessionNotFoundError);
  });

  test("Should return ForbiddenError when the session belongs to another user", async () => {
    const result = await revokeSession(
      { sessionRepository },
      { userId: intruderId, sessionId: ownedSession.id },
    );

    expect(result).toBeInstanceOf(ForbiddenError);
    const stillActive = await sessionRepository.findById(ownedSession.id);
    expect(stillActive?.revokedAt).toBeFalsy();
  });
});
