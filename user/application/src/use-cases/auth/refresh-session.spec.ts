import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockJwtService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import {
  generateRefreshTokenRotationConfig,
  generateUser,
} from "../../mocks/factories.js";
import { mockEntitlementsProvider } from "../../mocks/mock-entitlements-provider.js";
import { mockSessionRepository } from "../../mocks/mock-session-repository.js";
import { refreshSession, type RefreshTokenRotationConfig } from "./refresh-session.js";
import { InvalidOrExpiredCodeError } from "../../errors/invalid-or-expired-code.js";
import { CapabilityKey, CapabilityState, type Session, type User } from "@user/domain";

describe("refreshSession", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let entitlementsProvider: ReturnType<typeof mockEntitlementsProvider>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;

  let rotationConfig: RefreshTokenRotationConfig;
  let existingUser: User;
  let rawRefreshToken: string;
  let activeSession: Session;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    jwtService = mockJwtService();
    userRepository = mockUserRepository();
    entitlementsProvider = mockEntitlementsProvider();
    sessionRepository = mockSessionRepository();
    rotationConfig = generateRefreshTokenRotationConfig();

    existingUser = generateUser({ enabledModules: [] });
    await userRepository.save(existingUser);

    rawRefreshToken = await cryptoService.generateRandomToken();
    const refreshTokenHash = await cryptoService.hashToken(rawRefreshToken);

    activeSession = {
      id: await cryptoService.generateUUID(),
      userId: existingUser.id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      userAgent: "Mozilla/5.0",
      ipAddress: "127.0.0.1",
      createdAt: new Date(),
    };
    await sessionRepository.save(activeSession);
  });

  const deps = () => ({
    cryptoService,
    jwtService,
    userRepository,
    sessionRepository,
    entitlementsProvider,
  });

  test("Should return a new access token and refresh token on success", async () => {
    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  test("Should return different tokens from the originals", async () => {
    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    expect(result.refreshToken).not.toBe(rawRefreshToken);
  });

  test("Should encode the user ID in the new access token sub claim", async () => {
    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    const payload = await jwtService.verify(result.accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(existingUser.id);
  });

  test("Should return the authenticated user's data", async () => {
    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    expect(result.user.id).toBe(existingUser.id);
    expect(result.user.email).toBe(existingUser.email);
    expect(result.user.firstName).toBe(existingUser.firstName);
    expect(result.user.lastName).toBe(existingUser.lastName);
  });

  test("Should revoke the old session (token rotation)", async () => {
    await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    const oldSession = sessionRepository.sessions.find(
      (s) => s.id === activeSession.id,
    );
    expect(oldSession?.revokedAt).not.toBeNull();
  });

  test("Should create a new session replacing the old one", async () => {
    await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    const activeSessions = sessionRepository.sessions.filter(
      (s) => !s.revokedAt,
    );
    expect(activeSessions).toHaveLength(1);
    expect(activeSessions[0].id).not.toBe(activeSession.id);
  });

  test("Should store the hashed refresh token in the new session, not the plain value", async () => {
    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    const newSession = sessionRepository.sessions.find(
      (s) => !s.revokedAt,
    );
    expect(newSession).toBeDefined();
    expect(newSession!.refreshTokenHash).not.toBe(result.refreshToken);
  });

  test("Should create the new session with a ~30-day expiry", async () => {
    const before = new Date();

    await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    const after = new Date();
    const newSession = sessionRepository.sessions.find((s) => !s.revokedAt);
    expect(newSession).toBeDefined();

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(newSession!.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime() + thirtyDaysMs - 1000,
    );
    expect(newSession!.expiresAt.getTime()).toBeLessThanOrEqual(
      after.getTime() + thirtyDaysMs + 1000,
    );
  });

  test("Should link the new session to the same user", async () => {
    await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    const newSession = sessionRepository.sessions.find((s) => !s.revokedAt);
    expect(newSession!.userId).toBe(existingUser.id);
  });

  test("Should return InvalidOrExpiredCodeError when the refresh token is not found", async () => {
    const result = await refreshSession(deps(), rotationConfig, {
      rawRefreshToken: "unknown-token",
    });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when the session is already revoked", async () => {
    await sessionRepository.revoke(activeSession.id);

    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when the session has expired", async () => {
    const expiredSession: Session = {
      ...activeSession,
      id: await cryptoService.generateUUID(),
      expiresAt: new Date(Date.now() - 1000),
    };

    sessionRepository.reset();
    await sessionRepository.save(expiredSession);

    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when the user no longer exists", async () => {
    userRepository.reset();

    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when the user is disabled", async () => {
    const disabledUser: User = { ...existingUser, enabled: false };
    await userRepository.save(disabledUser);

    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should truncate userAgent to 500 characters when it exceeds the limit", async () => {
    const longUserAgent = "A".repeat(501);

    await refreshSession(deps(), rotationConfig, { rawRefreshToken, userAgent: longUserAgent });

    const newSession = sessionRepository.sessions.find((s) => !s.revokedAt);
    expect(newSession).toBeDefined();
    expect(newSession!.userAgent).toHaveLength(500);
  });

  test("Should truncate ipAddress to 45 characters when it exceeds the limit", async () => {
    const longIpAddress = "1".repeat(46);

    await refreshSession(deps(), rotationConfig, { rawRefreshToken, ipAddress: longIpAddress });

    const newSession = sessionRepository.sessions.find((s) => !s.revokedAt);
    expect(newSession).toBeDefined();
    expect(newSession!.ipAddress).toHaveLength(45);
  });

  test("Should return the modules the learner turned off as disabled", async () => {
    const result = await refreshSession(deps(), rotationConfig, { rawRefreshToken });
    if (result instanceof InvalidOrExpiredCodeError) throw result;

    expect(result.user.capabilities[CapabilityKey.LEARNING_PATHS].state).toBe(
      CapabilityState.DISABLED,
    );
    expect(result.user.capabilities[CapabilityKey.RESOURCE_LIBRARY].state).toBe(
      CapabilityState.ENABLED,
    );
  });

  describe("when a rotated token is presented again", () => {
    let replacementToken: string;

    beforeEach(async () => {
      const firstRefresh = await refreshSession(deps(), rotationConfig, {
        rawRefreshToken,
      });
      if (firstRefresh instanceof InvalidOrExpiredCodeError) throw firstRefresh;
      replacementToken = firstRefresh.refreshToken;
    });

    const moveRotationBeyondGrace = () => {
      const index = sessionRepository.sessions.findIndex(
        (s) => s.id === activeSession.id,
      );
      const beyondGrace = new Date(
        Date.now() - (rotationConfig.graceSeconds + 1) * 1000,
      );
      sessionRepository.sessions[index] = {
        ...sessionRepository.sessions[index],
        rotatedAt: beyondGrace,
      };
    };

    test("Should return the same replacement token within the grace window", async () => {
      const retry = await refreshSession(deps(), rotationConfig, { rawRefreshToken });
      if (retry instanceof InvalidOrExpiredCodeError) throw retry;

      expect(retry.refreshToken).toBe(replacementToken);
    });

    test("Should issue an access token for the learner within the grace window", async () => {
      const retry = await refreshSession(deps(), rotationConfig, { rawRefreshToken });
      if (retry instanceof InvalidOrExpiredCodeError) throw retry;

      const payload = await jwtService.verify(retry.accessToken);
      expect(payload!.sub).toBe(existingUser.id);
    });

    test("Should not create another session within the grace window", async () => {
      const sessionsAfterRotation = sessionRepository.count();

      await refreshSession(deps(), rotationConfig, { rawRefreshToken });

      expect(sessionRepository.count()).toBe(sessionsAfterRotation);
    });

    test("Should return InvalidOrExpiredCodeError after the grace window", async () => {
      moveRotationBeyondGrace();

      const retry = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

      expect(retry).toBeInstanceOf(InvalidOrExpiredCodeError);
    });

    test("Should return InvalidOrExpiredCodeError once the replacement was signed out", async () => {
      const replacementHash = await cryptoService.hashToken(replacementToken);
      const replacement = await sessionRepository.findByRefreshTokenHash(replacementHash);
      await sessionRepository.revoke(replacement!.id);

      const retry = await refreshSession(deps(), rotationConfig, { rawRefreshToken });

      expect(retry).toBeInstanceOf(InvalidOrExpiredCodeError);
    });

    test("Should keep the replacement token usable", async () => {
      const nextRefresh = await refreshSession(deps(), rotationConfig, {
        rawRefreshToken: replacementToken,
      });

      expect(nextRefresh).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    });
  });

  describe("when two refreshes race on the same token", () => {
    test("Should succeed for both with the same replacement token", async () => {
      const [firstRefresh, secondRefresh] = await Promise.all([
        refreshSession(deps(), rotationConfig, { rawRefreshToken }),
        refreshSession(deps(), rotationConfig, { rawRefreshToken }),
      ]);
      if (firstRefresh instanceof InvalidOrExpiredCodeError) throw firstRefresh;
      if (secondRefresh instanceof InvalidOrExpiredCodeError) throw secondRefresh;

      expect(secondRefresh.refreshToken).toBe(firstRefresh.refreshToken);
    });

    test("Should leave a single active session", async () => {
      await Promise.all([
        refreshSession(deps(), rotationConfig, { rawRefreshToken }),
        refreshSession(deps(), rotationConfig, { rawRefreshToken }),
      ]);

      expect(sessionRepository.sessions.filter((s) => !s.revokedAt)).toHaveLength(1);
    });
  });
});
