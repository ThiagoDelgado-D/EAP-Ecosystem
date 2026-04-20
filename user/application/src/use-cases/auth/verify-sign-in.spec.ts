import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockJwtService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { mockIdentityRepository } from "../../mocks/mock-identity-repository.js";
import { mockSignInChallengeRepository } from "../../mocks/mock-sign-in-challenge-repository.js";
import { mockSessionRepository } from "../../mocks/mock-session-repository.js";
import { verifySignIn } from "./verify-sign-in.js";
import { InvalidOrExpiredCodeError } from "../../errors/invalid-or-expired-code.js";
import type { Identity, SignInChallenge, User } from "@user/domain";

describe("verifySignIn", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let identityRepository: ReturnType<typeof mockIdentityRepository>;
  let signInChallengeRepository: ReturnType<
    typeof mockSignInChallengeRepository
  >;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;

  const EMAIL = "thiago@example.com";
  const VALID_CODE = "482910";

  let activeChallenge: SignInChallenge;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    jwtService = mockJwtService();
    userRepository = mockUserRepository();
    identityRepository = mockIdentityRepository();
    signInChallengeRepository = mockSignInChallengeRepository();
    sessionRepository = mockSessionRepository();

    activeChallenge = {
      id: await cryptoService.generateUUID(),
      email: EMAIL,
      codeHash: await cryptoService.hashPassword(VALID_CODE),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      consumed: false,
      createdAt: new Date(),
    };

    await signInChallengeRepository.save(activeChallenge);
  });

  const deps = () => ({
    cryptoService,
    jwtService,
    userRepository,
    identityRepository,
    signInChallengeRepository,
    sessionRepository,
  });

  test("Should create a new User and Identity when the email is not registered", async () => {
    await verifySignIn(deps(), { email: EMAIL, code: VALID_CODE });

    expect(userRepository.count()).toBe(1);
    expect(userRepository.users[0].email).toBe(EMAIL);

    expect(identityRepository.count()).toBe(1);
    expect(identityRepository.identities[0].provider).toBe("magic-link");
    expect(identityRepository.identities[0].providerSubject).toBe(EMAIL);
    expect(identityRepository.identities[0].verified).toBe(true);
  });

  test("New user identity should be linked to the created user", async () => {
    await verifySignIn(deps(), { email: EMAIL, code: VALID_CODE });

    const user = userRepository.users[0];
    const identity = identityRepository.identities[0];

    expect(identity.userId).toBe(user.id);
  });

  test("Should not create a new User or Identity when the email is already registered", async () => {
    const existingUser: User = {
      id: await cryptoService.generateUUID(),
      email: EMAIL,
      firstName: "Thiago",
      lastName: "Delgado",
      userName: null,
      enabled: true,
      featureConfig: [],
      widgetConfig: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await userRepository.save(existingUser);

    const existingIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: existingUser.id,
      provider: "magic-link",
      providerSubject: EMAIL,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await identityRepository.save(existingIdentity);

    await verifySignIn(deps(), { email: EMAIL, code: VALID_CODE });

    expect(userRepository.count()).toBe(1);
    expect(identityRepository.count()).toBe(1);
  });

  test("Should return the existing user's data when the email is already registered", async () => {
    const existingUser: User = {
      id: await cryptoService.generateUUID(),
      email: EMAIL,
      firstName: "Thiago",
      lastName: "Delgado",
      userName: null,
      enabled: true,
      featureConfig: [],
      widgetConfig: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await userRepository.save(existingUser);

    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    const output = result as Awaited<ReturnType<typeof verifySignIn>>;
    if (output instanceof InvalidOrExpiredCodeError) return;

    expect(output.user.id).toBe(existingUser.id);
    expect(output.user.firstName).toBe("Thiago");
    expect(output.user.lastName).toBe("Delgado");
  });

  test("Should return an access token and a refresh token on success", async () => {
    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });

    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    const output = result as Awaited<ReturnType<typeof verifySignIn>>;
    if (output instanceof InvalidOrExpiredCodeError) return;

    expect(output.accessToken).toBeTruthy();
    expect(output.refreshToken).toBeTruthy();
    expect(output.accessToken).not.toBe(output.refreshToken);
  });

  test("Should encode the user ID in the access token sub claim", async () => {
    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });
    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    const payload = await jwtService.verify(result.accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(userRepository.users[0].id);
  });

  test("Should persist a session with the hashed refresh token, not the plain value", async () => {
    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });
    expect(result).not.toBeInstanceOf(InvalidOrExpiredCodeError);
    if (result instanceof InvalidOrExpiredCodeError) return;

    expect(sessionRepository.count()).toBe(1);
    const session = sessionRepository.sessions[0];

    expect(session.refreshTokenHash).not.toBe(result.refreshToken);
    expect(session.revokedAt).toBeNull();
  });

  test("Should create a session with a ~30-day expiry", async () => {
    const before = new Date();

    await verifySignIn(deps(), { email: EMAIL, code: VALID_CODE });

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
    await verifySignIn(deps(), { email: EMAIL, code: VALID_CODE });

    const session = sessionRepository.sessions[0];
    const user = userRepository.users[0];

    expect(session.userId).toBe(user.id);
  });

  test("Should consume the challenge after a successful verification", async () => {
    await verifySignIn(deps(), { email: EMAIL, code: VALID_CODE });

    const challenge = signInChallengeRepository.challenges[0];
    expect(challenge.consumed).toBe(true);
  });

  test("Should not allow the same challenge to be used twice", async () => {
    await verifySignIn(deps(), { email: EMAIL, code: VALID_CODE });
    const secondResult = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });

    expect(secondResult).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError for a wrong code", async () => {
    const result = await verifySignIn(deps(), { email: EMAIL, code: "000000" });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should increment attempt count when a wrong code is submitted", async () => {
    await verifySignIn(deps(), { email: EMAIL, code: "000000" });

    const challenge = signInChallengeRepository.challenges[0];
    expect(challenge.attempts).toBe(1);
  });

  test("Should return InvalidOrExpiredCodeError when attempt limit (5) is reached, even with the correct code", async () => {
    const lockedChallenge: SignInChallenge = {
      ...activeChallenge,
      id: await cryptoService.generateUUID(),
      attempts: 5,
      consumed: false,
    };

    signInChallengeRepository.reset();
    await signInChallengeRepository.save(lockedChallenge);

    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
    const stored = signInChallengeRepository.challenges[0];
    expect(stored.attempts).toBe(5);
  });

  test("Should return InvalidOrExpiredCodeError for an expired challenge", async () => {
    const expiredChallenge: SignInChallenge = {
      ...activeChallenge,
      id: await cryptoService.generateUUID(),
      expiresAt: new Date(Date.now() - 1000),
    };

    signInChallengeRepository.reset();
    await signInChallengeRepository.save(expiredChallenge);

    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when no challenge exists for the email", async () => {
    signInChallengeRepository.reset();

    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: VALID_CODE,
    });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError for an invalid email format", async () => {
    const result = await verifySignIn(deps(), {
      email: "not-an-email",
      code: VALID_CODE,
    });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when code is shorter than 6 digits", async () => {
    const result = await verifySignIn(deps(), { email: EMAIL, code: "12345" });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });

  test("Should return InvalidOrExpiredCodeError when code is longer than 6 digits", async () => {
    const result = await verifySignIn(deps(), {
      email: EMAIL,
      code: "1234567",
    });

    expect(result).toBeInstanceOf(InvalidOrExpiredCodeError);
  });
});
