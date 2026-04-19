import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockSignInChallengeRepository } from "../../mocks/mock-sign-in-challenge-repository.js";
import { MockedEmailService } from "../../mocks/mock-email-service.js";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { requestSignIn } from "./request-sign-in.js";

describe("requestSignIn", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let signInChallengeRepository: ReturnType<
    typeof mockSignInChallengeRepository
  >;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let emailService: MockedEmailService;

  beforeEach(() => {
    cryptoService = mockCryptoService();
    signInChallengeRepository = mockSignInChallengeRepository();
    userRepository = mockUserRepository();
    emailService = new MockedEmailService();
  });

  const deps = () => ({
    cryptoService,
    signInChallengeRepository,
    userRepository,
    emailService,
  });

  test("Should create a challenge for a valid email", async () => {
    await requestSignIn(deps(), { email: "thiago@example.com" });

    expect(signInChallengeRepository.count()).toBe(1);
    expect(signInChallengeRepository.challenges[0].email).toBe(
      "thiago@example.com",
    );
  });

  test("Should send a MAGIC_LINK_CODE email to the provided address", async () => {
    await requestSignIn(deps(), { email: "thiago@example.com" });

    expect(emailService.hasTemplateEmail("MAGIC_LINK_CODE")).toBe(true);

    const sent = emailService.getLastEmail();
    expect(sent).toBeDefined();
    expect("to" in sent! && sent.to).toContain("thiago@example.com");
  });

  test("Should store the code as a hash, not as plain text", async () => {
    await requestSignIn(deps(), { email: "thiago@example.com" });

    const challenge = signInChallengeRepository.challenges[0];
    const sentEmail = emailService.getLastEmail();
    const plainCode =
      "template" in sentEmail! ? (sentEmail.data as { code: string }).code : "";

    expect(challenge.codeHash).not.toBe(plainCode);
    expect(challenge.codeHash.length).toBeGreaterThan(0);
  });

  test("Should create a challenge with 0 attempts and not consumed", async () => {
    await requestSignIn(deps(), { email: "thiago@example.com" });

    const challenge = signInChallengeRepository.challenges[0];
    expect(challenge.attempts).toBe(0);
    expect(challenge.consumed).toBe(false);
  });

  test("Should create a challenge that expires in roughly 10 minutes", async () => {
    const before = new Date();

    await requestSignIn(deps(), { email: "thiago@example.com" });

    const after = new Date();
    const challenge = signInChallengeRepository.challenges[0];
    const tenMinMs = 10 * 60 * 1000;

    expect(challenge.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime() + tenMinMs - 100,
    );
    expect(challenge.expiresAt.getTime()).toBeLessThanOrEqual(
      after.getTime() + tenMinMs + 100,
    );
  });

  test("Should invalidate a previous pending challenge before issuing a new one", async () => {
    await requestSignIn(deps(), { email: "thiago@example.com" });
    await requestSignIn(deps(), { email: "thiago@example.com" });

    const active =
      await signInChallengeRepository.findActiveByEmail("thiago@example.com");
    const total = signInChallengeRepository.count();

    expect(total).toBe(2);
    expect(active).not.toBeNull();
    expect(active!.id).toBe(signInChallengeRepository.challenges[1].id);
    expect(signInChallengeRepository.challenges[0].consumed).toBe(true);
  });

  test("Should create independent challenges for different emails", async () => {
    await requestSignIn(deps(), { email: "thiago@example.com" });
    await requestSignIn(deps(), { email: "other@example.com" });

    expect(signInChallengeRepository.count()).toBe(2);

    const first =
      await signInChallengeRepository.findActiveByEmail("thiago@example.com");
    const second =
      await signInChallengeRepository.findActiveByEmail("other@example.com");

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
  });

  test("Should return void for an invalid email without creating a challenge or sending an email", async () => {
    const result = await requestSignIn(deps(), { email: "not-an-email" });

    expect(result).toBeUndefined();
    expect(signInChallengeRepository.count()).toBe(0);
    expect(emailService.sentEmails).toHaveLength(0);
  });

  test("Should return void for an empty email without side effects", async () => {
    const result = await requestSignIn(deps(), { email: "" });

    expect(result).toBeUndefined();
    expect(signInChallengeRepository.count()).toBe(0);
    expect(emailService.sentEmails).toHaveLength(0);
  });
});
