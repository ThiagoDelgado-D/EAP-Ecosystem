import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockSessionRepository } from "../../mocks/mock-session-repository.js";
import { signOut } from "./sign-out.js";
import type { Session } from "@user/domain";

describe("signOut", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;

  let rawRefreshToken: string;
  let activeSession: Session;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();

    rawRefreshToken = await cryptoService.generateRandomToken();
    const refreshTokenHash = await cryptoService.hashToken(rawRefreshToken);

    activeSession = {
      id: await cryptoService.generateUUID(),
      userId: await cryptoService.generateUUID(),
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
    };
    await sessionRepository.save(activeSession);
  });

  const deps = () => ({ cryptoService, sessionRepository });

  test("Should revoke the session associated with the refresh token", async () => {
    await signOut(deps(), { rawRefreshToken });

    const session = sessionRepository.sessions.find(
      (s) => s.id === activeSession.id,
    );
    expect(session?.revokedAt).not.toBeNull();
  });

  test("Should complete without error when the token does not match any session", async () => {
    await expect(
      signOut(deps(), { rawRefreshToken: "unknown-token" }),
    ).resolves.toBeUndefined();
  });

  test("Should complete without error when the session is already revoked", async () => {
    await sessionRepository.revoke(activeSession.id);

    // findByRefreshTokenHash filters out revoked sessions, so this is a no-op
    await expect(
      signOut(deps(), { rawRefreshToken }),
    ).resolves.toBeUndefined();
  });

  test("Should not revoke other sessions when signing out one", async () => {
    const otherToken = await cryptoService.generateRandomToken();
    const otherSession: Session = {
      id: await cryptoService.generateUUID(),
      userId: activeSession.userId,
      refreshTokenHash: await cryptoService.hashToken(otherToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
    };
    await sessionRepository.save(otherSession);

    await signOut(deps(), { rawRefreshToken });

    const other = sessionRepository.sessions.find(
      (s) => s.id === otherSession.id,
    );
    expect(other?.revokedAt).toBeNull();
  });
});
