import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockCryptoService, mockJwtService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { mockIdentityRepository } from "../../mocks/mock-identity-repository.js";
import { mockSessionRepository } from "../../mocks/mock-session-repository.js";
import { handleGoogleOAuth, GoogleOAuthError } from "./handle-google-oauth.js";
import type { Identity, User } from "@user/domain";

const GOOGLE_PROFILE = {
  id: "google_sub_123",
  email: "thiago@example.com",
  given_name: "Thiago",
  family_name: "Delgado",
  verified_email: true,
};

interface GoogleProfileMock {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  verified_email?: boolean;
}

const GOOGLE_CONFIG = {
  clientId: "test_client_id",
  clientSecret: "test_client_secret",
  redirectUrl: "http://localhost:3000/api/v1/auth/google/callback",
};

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function stubGoogleSuccess(profile: GoogleProfileMock = GOOGLE_PROFILE) {
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "google_access_token" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => profile,
    });
}

describe("handleGoogleOAuth", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let identityRepository: ReturnType<typeof mockIdentityRepository>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;

  beforeEach(() => {
    mockFetch.mockReset();
    cryptoService = mockCryptoService();
    jwtService = mockJwtService();
    userRepository = mockUserRepository();
    identityRepository = mockIdentityRepository();
    sessionRepository = mockSessionRepository();
  });

  const deps = () => ({
    cryptoService,
    jwtService,
    userRepository,
    identityRepository,
    sessionRepository,
  });

  test("Should create a new User when no account exists for the Google email", async () => {
    stubGoogleSuccess();

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    expect(userRepository.count()).toBe(1);
    expect(userRepository.users[0].email).toBe(GOOGLE_PROFILE.email);
  });

  test("Should populate firstName and lastName from the Google profile for a new user", async () => {
    stubGoogleSuccess();

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    const user = userRepository.users[0];
    expect(user.firstName).toBe("Thiago");
    expect(user.lastName).toBe("Delgado");
  });

  test("Should create a Google Identity linked to the new user", async () => {
    stubGoogleSuccess();

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    expect(identityRepository.count()).toBe(1);
    const identity = identityRepository.identities[0];
    expect(identity.provider).toBe("google");
    expect(identity.providerSubject).toBe(GOOGLE_PROFILE.id);
    expect(identity.verified).toBe(true);
    expect(identity.userId).toBe(userRepository.users[0].id);
  });

  test("New user should have onboardingCompleted set to false", async () => {
    stubGoogleSuccess();

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    expect(userRepository.users[0].onboardingCompleted).toBe(false);
  });

  test("Should not create a new User when a Google Identity already exists", async () => {
    stubGoogleSuccess();

    const existingUser: User = {
      id: await cryptoService.generateUUID(),
      email: GOOGLE_PROFILE.email,
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

    const existingIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: existingUser.id,
      provider: "google",
      providerSubject: GOOGLE_PROFILE.id,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await identityRepository.save(existingIdentity);

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    expect(userRepository.count()).toBe(1);
    expect(identityRepository.count()).toBe(1);
  });

  test("Should return the existing user's data when a Google Identity already exists", async () => {
    stubGoogleSuccess();

    const existingUser: User = {
      id: await cryptoService.generateUUID(),
      email: GOOGLE_PROFILE.email,
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

    const existingIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: existingUser.id,
      provider: "google",
      providerSubject: GOOGLE_PROFILE.id,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await identityRepository.save(existingIdentity);

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).not.toBeInstanceOf(GoogleOAuthError);
    if (result instanceof GoogleOAuthError) return;

    expect(result.user.id).toBe(existingUser.id);
    expect(result.user.onboardingCompleted).toBe(true);
  });

  test("Should link a Google Identity to an existing magic-link user without creating a new User", async () => {
    stubGoogleSuccess();

    const existingUser: User = {
      id: await cryptoService.generateUUID(),
      email: GOOGLE_PROFILE.email,
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

    const magicLinkIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: existingUser.id,
      provider: "magic-link",
      providerSubject: GOOGLE_PROFILE.email,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await identityRepository.save(magicLinkIdentity);

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    expect(userRepository.count()).toBe(1);
    expect(identityRepository.count()).toBe(2);

    const googleIdentity = identityRepository.identities.find(
      (i) => i.provider === "google",
    );
    expect(googleIdentity).toBeDefined();
    expect(googleIdentity!.userId).toBe(existingUser.id);
  });

  test("Should return an accessToken and a refreshToken on success", async () => {
    stubGoogleSuccess();

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).not.toBeInstanceOf(GoogleOAuthError);
    if (result instanceof GoogleOAuthError) return;

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.accessToken).not.toBe(result.refreshToken);
  });

  test("Should encode the user ID in the access token sub claim", async () => {
    stubGoogleSuccess();

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).not.toBeInstanceOf(GoogleOAuthError);
    if (result instanceof GoogleOAuthError) return;

    const payload = await jwtService.verify(result.accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(userRepository.users[0].id);
  });

  test("Should persist a session with the hashed refresh token, not the plain value", async () => {
    stubGoogleSuccess();

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).not.toBeInstanceOf(GoogleOAuthError);
    if (result instanceof GoogleOAuthError) return;

    expect(sessionRepository.count()).toBe(1);
    const session = sessionRepository.sessions[0];
    expect(session.refreshTokenHash).not.toBe(result.refreshToken);
    expect(session.revokedAt).toBeNull();
  });

  test("Should create a session with a ~30-day expiry", async () => {
    stubGoogleSuccess();

    const before = new Date();
    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });
    const after = new Date();

    const session = sessionRepository.sessions[0];
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime() + thirtyDaysMs - 1000,
    );
    expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
      after.getTime() + thirtyDaysMs + 1000,
    );
  });

  test("Should link the session to the authenticated user", async () => {
    stubGoogleSuccess();

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    const session = sessionRepository.sessions[0];
    const user = userRepository.users[0];
    expect(session.userId).toBe(user.id);
  });

  test("Should return GoogleOAuthError when the token exchange fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "bad_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
  });

  test("Should return GoogleOAuthError when the profile fetch fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "google_access_token" }),
      })
      .mockResolvedValueOnce({ ok: false });

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
  });

  test("Should return GoogleOAuthError when an existing Identity has no matching User", async () => {
    stubGoogleSuccess();

    const orphanIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: "non-existent-user-id",
      provider: "google",
      providerSubject: GOOGLE_PROFILE.id,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await identityRepository.save(orphanIdentity);

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
  });

  test("Should not create any User or session when a Google API call fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "bad_code" });

    expect(userRepository.count()).toBe(0);
    expect(sessionRepository.count()).toBe(0);
  });

  test("Should use empty strings for firstName and lastName when Google profile has no name", async () => {
    stubGoogleSuccess({
      id: "google_sub_123",
      email: "thiago@example.com",
      verified_email: true,
    });

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    const user = userRepository.users[0];
    expect(user.firstName).toBe("");
    expect(user.lastName).toBe("");
  });

  test("Should set verified to false when Google profile has verified_email=false", async () => {
    stubGoogleSuccess({ ...GOOGLE_PROFILE, verified_email: false });

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    const identity = identityRepository.identities[0];
    expect(identity.verified).toBe(false);
  });
});
