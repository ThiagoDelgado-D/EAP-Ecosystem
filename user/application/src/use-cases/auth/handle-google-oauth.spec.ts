import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockCryptoService, mockJwtService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { mockIdentityRepository } from "../../mocks/mock-identity-repository.js";
import { mockSessionRepository } from "../../mocks/mock-session-repository.js";
import { handleGoogleOAuth, GoogleOAuthError } from "./handle-google-oauth.js";
import type { Identity, User } from "@user/domain";
import { DEFAULT_APPEARANCE } from "@user/domain";

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
      appearance: DEFAULT_APPEARANCE,
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
      appearance: DEFAULT_APPEARANCE,
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
      appearance: DEFAULT_APPEARANCE,
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

  test("Should reject Google sign-in when the email is not verified", async () => {
    stubGoogleSuccess({ ...GOOGLE_PROFILE, verified_email: false });

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
      appearance: DEFAULT_APPEARANCE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await userRepository.save(existingUser);

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
    expect(userRepository.count()).toBe(1);
    expect(identityRepository.count()).toBe(0);
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

  test("Should return GoogleOAuthError when the token exchange throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "bad_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
  });

  test("Should return GoogleOAuthError when the token payload cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("bad json");
      },
    });

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

  test("Should return GoogleOAuthError when the profile fetch throws", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "google_access_token" }),
      })
      .mockRejectedValueOnce(new Error("network down"));

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
  });

  test("Should return GoogleOAuthError when the profile payload cannot be parsed", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "google_access_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("bad json");
        },
      });

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

  test("Should return GoogleOAuthError when Google profile email is not verified", async () => {
    stubGoogleSuccess({ ...GOOGLE_PROFILE, verified_email: false });

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
    expect(identityRepository.count()).toBe(0);
  });

  test("Should persist userAgent and ipAddress on the session when provided", async () => {
    stubGoogleSuccess();

    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const ipAddress = "203.0.113.42";

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
      userAgent,
      ipAddress,
    });

    const session = sessionRepository.sessions[0];
    expect(session.userAgent).toBe(userAgent);
    expect(session.ipAddress).toBe(ipAddress);
  });

  test("Should truncate userAgent to 500 characters and ipAddress to 45 characters when they exceed the limit", async () => {
    stubGoogleSuccess();

    const longUserAgent = "A".repeat(600);
    const longIpAddress = "1".repeat(60);

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
      userAgent: longUserAgent,
      ipAddress: longIpAddress,
    });

    const session = sessionRepository.sessions[0];
    expect(session.userAgent).toBe(longUserAgent.slice(0, 500));
    expect(session.userAgent).toHaveLength(500);
    expect(session.ipAddress).toBe(longIpAddress.slice(0, 45));
    expect(session.ipAddress).toHaveLength(45);
  });

  test("Should recover and sign in when a concurrent process created the User before the save completed", async () => {
    stubGoogleSuccess();

    const concurrentUser: User = {
      id: await cryptoService.generateUUID(),
      email: GOOGLE_PROFILE.email,
      firstName: GOOGLE_PROFILE.given_name!,
      lastName: GOOGLE_PROFILE.family_name!,
      userName: null,
      enabled: true,
      onboardingCompleted: false,
      featureConfig: [],
      widgetConfig: [],
      appearance: DEFAULT_APPEARANCE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userRepository.users.push(concurrentUser);
    userRepository.save = async () => {
      throw new Error("unique constraint violation");
    };

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).not.toBeInstanceOf(GoogleOAuthError);
    if (result instanceof GoogleOAuthError) return;

    expect(result.user.email).toBe(GOOGLE_PROFILE.email);
    expect(result.user.id).toBe(concurrentUser.id);
    expect(sessionRepository.count()).toBe(1);
  });

  test("Should return GoogleOAuthError when userRepository.save throws and the user cannot be recovered via findByEmail", async () => {
    stubGoogleSuccess();

    // Override save to throw; no user pre-seeded, so findByEmail returns null
    userRepository.save = async () => {
      throw new Error("unique constraint violation");
    };

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
    expect((result as GoogleOAuthError).message).toBe(
      "Failed to create Google OAuth user",
    );
    expect(sessionRepository.count()).toBe(0);
  });

  test("Should return GoogleOAuthError when identityRepository.save throws and no concurrent Identity exists", async () => {
    stubGoogleSuccess();

    identityRepository.save = async () => {
      throw new Error("DB error");
    };
    let findByProviderCallCount = 0;
    identityRepository.findByProvider = async () => {
      findByProviderCallCount++;
      return null; // both initial check and catch-block recovery return null
    };

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
    expect((result as GoogleOAuthError).message).toBe(
      "Failed to link Google identity",
    );
    expect(userRepository.count()).toBe(1);
    expect(sessionRepository.count()).toBe(0);
  });

  test("Should return GoogleOAuthError when the recovered concurrent Identity has no matching User", async () => {
    stubGoogleSuccess();

    const orphanIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: "ghost-user-id",
      provider: "google",
      providerSubject: GOOGLE_PROFILE.id,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    identityRepository.save = async () => {
      throw new Error("unique constraint");
    };
    let findByProviderCallCount = 0;
    identityRepository.findByProvider = async () => {
      findByProviderCallCount++;
      if (findByProviderCallCount === 1) return null;
      return orphanIdentity;
    };

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).toBeInstanceOf(GoogleOAuthError);
    expect((result as GoogleOAuthError).message).toBe(
      "User not found for existing identity",
    );
    expect(sessionRepository.count()).toBe(0);
  });

  test("Should create a new user with DEFAULT_APPEARANCE when no account exists", async () => {
    stubGoogleSuccess();

    await handleGoogleOAuth(deps(), GOOGLE_CONFIG, { code: "auth_code" });

    const user = userRepository.users[0];
    expect(user.appearance).toEqual(DEFAULT_APPEARANCE);
  });

  test("Should recover and sign in when a concurrent process linked the Google Identity before the save completed", async () => {
    stubGoogleSuccess();

    const concurrentUser: User = {
      id: await cryptoService.generateUUID(),
      email: GOOGLE_PROFILE.email,
      firstName: GOOGLE_PROFILE.given_name!,
      lastName: GOOGLE_PROFILE.family_name!,
      userName: null,
      enabled: true,
      onboardingCompleted: false,
      featureConfig: [],
      widgetConfig: [],
      appearance: DEFAULT_APPEARANCE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await userRepository.save(concurrentUser);

    const concurrentIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: concurrentUser.id,
      provider: "google",
      providerSubject: GOOGLE_PROFILE.id,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    identityRepository.save = async () => {
      throw new Error("unique constraint");
    };
    let findByProviderCallCount = 0;
    identityRepository.findByProvider = async () => {
      findByProviderCallCount++;
      if (findByProviderCallCount === 1) return null;
      return concurrentIdentity;
    };

    const result = await handleGoogleOAuth(deps(), GOOGLE_CONFIG, {
      code: "auth_code",
    });

    expect(result).not.toBeInstanceOf(GoogleOAuthError);
    if (result instanceof GoogleOAuthError) return;

    expect(result.user.id).toBe(concurrentUser.id);
    expect(result.user.email).toBe(GOOGLE_PROFILE.email);
    expect(sessionRepository.count()).toBe(1);
    expect(sessionRepository.sessions[0].userId).toBe(concurrentUser.id);
  });
});
