import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockJwtService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { mockSessionRepository } from "../../mocks/mock-session-repository.js";
import { refreshSession } from "./refresh-session.js";
import { InvalidOrExpiredCodeError } from "../../errors/invalid-or-expired-code.js";
import type { Session, User } from "@user/domain";

describe("refreshSession", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;

  let existingUser: User;
  let rawRefreshToken: string;
  let activeSession: Session;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    jwtService = mockJwtService();
    userRepository = mockUserRepository();
    sessionRepository = mockSessionRepository();

    existingUser = {
      id: await cryptoService.generateUUID(),
      email: "thiago@example.com",
      firstName: "Thiago",
      lastName: "Delgado",
      userName: null,
      enabled: true,
      onboardingCompleted: true,
      featureConfig: [],
      widgetConfig: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
  });

  test("Should return a new access token and refresh token on success", async () => {
    const result = await refreshSession(deps(), { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  test("Should return different tokens from the originals", async () => {
    const result = await refreshSession(deps(), { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    expect(result.refreshToken).not.toBe(rawRefreshToken);
  });

  test("Should encode the user ID in the new access token sub claim", async () => {
    const result = await refreshSession(deps(), { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    const payload = await jwtService.verify(result.accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(existingUser.id);
  });

  test("Should return the authenticated user's data", async () => {
    const result = await refreshSession(deps(), { rawRefreshToken });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    expect(result.user.id).toBe(existingUser.id);
    expect(result.user.email).toBe(existingUser.email);
    expect(result.user.firstName).toBe(existingUser.firstName);
    expect(result.user.lastName).toBe(existingUser.lastName);
  });

  test("Should revoke the old session (token rotation)", async () => {
    await refreshSession(deps(), { rawRefreshToken });

    const oldSession = sessionRepository.sessions.find(
      (s) => s.id === activeSession.id,
    );
    expect(oldSession?.revokedAt).not.toBeNull();
  });

  test("Should create a new session replacing the old one", async () => {
    await refreshSession(deps(), { rawRefreshToken });

    const activeSessions = sessionRepository.sessions.filter(
      (s) => !s.revokedAt,
    );
    expect(activeSessions).toHaveLength(1);
    expect(activeSessions[0].id).not.toBe(activeSession.id);
  });

  test("Should store the hashed refresh token in the new session, not the plain value", async () => {
    const result = await refreshSession(deps(), { rawRefreshToken });

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

    await refreshSession(deps(), { rawRefreshToken });

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
    await refreshSession(deps(), { rawRefreshToken });

    const newSession = sessionRepository.sessions.find((s) => !s.revokedAt);
    expect(newSession!.userId).toBe(existingUser.id);
  });

  test("Should return InvalidOrExpiredCodeError when the refresh token is not found", async () => {
    const result = await refreshSession(deps(), {
      rawRefreshToken: "unknown-token",
    });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when the session is already revoked", async () => {
    await sessionRepository.revoke(activeSession.id);

    const result = await refreshSession(deps(), { rawRefreshToken });

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

    const result = await refreshSession(deps(), { rawRefreshToken });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when the user no longer exists", async () => {
    userRepository.reset();

    const result = await refreshSession(deps(), { rawRefreshToken });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when the user is disabled", async () => {
    const disabledUser: User = { ...existingUser, enabled: false };
    await userRepository.save(disabledUser);

    const result = await refreshSession(deps(), { rawRefreshToken });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should truncate userAgent to 500 characters when it exceeds the limit", async () => {
    const longUserAgent = "A".repeat(501);

    await refreshSession(deps(), { rawRefreshToken, userAgent: longUserAgent });

    const newSession = sessionRepository.sessions.find((s) => !s.revokedAt);
    expect(newSession).toBeDefined();
    expect(newSession!.userAgent).toHaveLength(500);
  });

  test("Should truncate ipAddress to 45 characters when it exceeds the limit", async () => {
    const longIpAddress = "1".repeat(46);

    await refreshSession(deps(), { rawRefreshToken, ipAddress: longIpAddress });

    const newSession = sessionRepository.sessions.find((s) => !s.revokedAt);
    expect(newSession).toBeDefined();
    expect(newSession!.ipAddress).toHaveLength(45);
  });
});
