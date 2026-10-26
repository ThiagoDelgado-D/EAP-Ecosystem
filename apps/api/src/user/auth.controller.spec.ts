import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { TooManyRequestsError, type TemplateSendEmailOptions } from "domain-lib";
import {
  CapabilityState,
  DEFAULT_ENABLED_MODULES,
  ModuleKey,
  SIGN_IN_REQUEST_BACKOFF,
} from "@user/domain";
import {
  generateEmail,
  generateIntakeAnswers,
  generateMalformedEmail,
  generateUser,
  generateWeeklyGoalMinutes,
} from "@user/application";
import { CryptoServiceImpl } from "infrastructure-lib";
import { createUserTestApp, type UserTestApp } from "./user-module.fixture.js";

const SIGN_IN_EMAIL = generateEmail();
const MALFORMED_EMAIL = generateMalformedEmail();

describe("AuthController (integration)", () => {
  let app: INestApplication;
  let challengeRepo: UserTestApp["challengeRepo"];
  let userRepo: UserTestApp["userRepo"];
  let identityRepo: UserTestApp["identityRepo"];
  let sessionRepo: UserTestApp["sessionRepo"];
  let emailService: UserTestApp["emailService"];
  let jwtService: UserTestApp["jwtService"];

  beforeAll(async () => {
    ({ app, challengeRepo, userRepo, identityRepo, sessionRepo, emailService, jwtService } =
      await createUserTestApp());
  });

  afterAll(async () => await app.close());

  afterEach(() => {
    challengeRepo.reset();
    userRepo.reset();
    identityRepo.reset();
    sessionRepo.reset();
    emailService.reset();
    jwtService.reset();
  });

  describe("POST /api/v1/auth/request-sign-in", () => {
    test("Should return 204 for valid email", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      expect(emailService.hasTemplateEmail("MAGIC_LINK_CODE")).toBe(true);
      expect(challengeRepo.challenges.filter((c) => !c.consumed)).toHaveLength(
        1,
      );
    });

    test("Should invalidate previous challenge when requesting again", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);
      challengeRepo.challenges[0].createdAt = new Date(
        Date.now() - SIGN_IN_REQUEST_BACKOFF.BASE_DELAY_MS - 1,
      );

      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      expect(challengeRepo.challenges.filter((c) => !c.consumed)).toHaveLength(
        1,
      );
    });

    test("Should return 429 with Retry-After when the same email asks again too soon", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      const blocked = await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(429);

      const retryAfterSeconds = Number(blocked.headers["retry-after"]);
      expect(blocked.body.error).toBe(new TooManyRequestsError().name);
      expect(blocked.body.retryAfterSeconds).toBe(retryAfterSeconds);
      expect(retryAfterSeconds).toBeGreaterThan(0);
      expect(retryAfterSeconds).toBeLessThanOrEqual(
        SIGN_IN_REQUEST_BACKOFF.BASE_DELAY_MS / 1000,
      );
    });

    test("Should return 400 for invalid email format", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: MALFORMED_EMAIL })
        .expect(400);
    });

    test("Should return 400 when email is missing", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({})
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/verify-sign-in", () => {
    const getCode = (): string => {
      const last =
        emailService.getLastEmail() as TemplateSendEmailOptions<"MAGIC_LINK_CODE">;
      return last.data.code as string;
    };

    test("Should return 200 with accessToken and user on valid code", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code: getCode() })
        .expect(200);

      expect(response.body.accessToken).toBe(jwtService.issuedTokens[0]);
      expect(response.body.user.email).toBe(SIGN_IN_EMAIL);
    });

    test("Should return the learner's capabilities with the user", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code: getCode() })
        .expect(200);

      for (const module of DEFAULT_ENABLED_MODULES) {
        expect(response.body.user.capabilities[module].state).toBe(CapabilityState.ENABLED);
      }
    });

    test("Should set refreshToken as HttpOnly cookie", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code: getCode() })
        .expect(200);

      const rawCookies = response.headers["set-cookie"];
      const cookies = Array.isArray(rawCookies)
        ? rawCookies
        : [rawCookies ?? ""];
      expect(
        cookies.some(
          (c) => c.includes("refreshToken") && c.includes("HttpOnly"),
        ),
      ).toBe(true);
    });

    test("Should consume the challenge — second verify with same code returns 400", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      const code = getCode();

      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code })
        .expect(200);

      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code })
        .expect(400);
    });

    test("Should return 400 for wrong code", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);

      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code: "000000" })
        .expect(400);
    });

    test("Should return 400 when no challenge exists", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code: "123456" })
        .expect(400);
    });

    test("Should return 400 for invalid email format", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: MALFORMED_EMAIL, code: "123456" })
        .expect(400);
    });

    test("Should return 400 when code is not 6 digits", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code: "123" })
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    const REFRESH_URL = "/api/v1/auth/refresh";

    const refreshCookieOf = (response: request.Response): string => {
      const rawCookies = response.headers["set-cookie"];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies ?? ""];
      const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
      if (!refreshCookie) throw new Error("No refreshToken cookie was set");
      return refreshCookie.split(";")[0];
    };

    const signInCookie = async (): Promise<string> => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: SIGN_IN_EMAIL })
        .expect(204);
      const last =
        emailService.getLastEmail() as TemplateSendEmailOptions<"MAGIC_LINK_CODE">;
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: SIGN_IN_EMAIL, code: last.data.code as string })
        .expect(200);
      return refreshCookieOf(response);
    };

    test("Should return 401 without a refresh cookie", async () => {
      await request(app.getHttpServer()).post(REFRESH_URL).expect(401);
    });

    test("Should return 400 for an unknown refresh cookie", async () => {
      const unknownToken = await new CryptoServiceImpl().generateRandomToken();
      const unknownCookie = `refreshToken=${unknownToken}`;

      await request(app.getHttpServer())
        .post(REFRESH_URL)
        .set("Cookie", unknownCookie)
        .expect(400);
    });

    test("Should rotate the refresh cookie and return an access token", async () => {
      const signedInCookie = await signInCookie();

      const response = await request(app.getHttpServer())
        .post(REFRESH_URL)
        .set("Cookie", signedInCookie)
        .expect(200);

      expect(response.body.accessToken).toBeTruthy();
      expect(refreshCookieOf(response)).not.toBe(signedInCookie);
    });

    test("Should return the same replacement cookie when the old one is sent again", async () => {
      const signedInCookie = await signInCookie();

      const firstRefresh = await request(app.getHttpServer())
        .post(REFRESH_URL)
        .set("Cookie", signedInCookie)
        .expect(200);
      const retry = await request(app.getHttpServer())
        .post(REFRESH_URL)
        .set("Cookie", signedInCookie)
        .expect(200);

      expect(refreshCookieOf(retry)).toBe(refreshCookieOf(firstRefresh));
    });

    test("Should answer two parallel refreshes with one cookie with the same replacement", async () => {
      const signedInCookie = await signInCookie();

      const [firstRefresh, secondRefresh] = await Promise.all([
        request(app.getHttpServer()).post(REFRESH_URL).set("Cookie", signedInCookie),
        request(app.getHttpServer()).post(REFRESH_URL).set("Cookie", signedInCookie),
      ]);

      expect(firstRefresh.status).toBe(200);
      expect(secondRefresh.status).toBe(200);
      expect(refreshCookieOf(secondRefresh)).toBe(refreshCookieOf(firstRefresh));
      expect(sessionRepo.sessions.filter((s) => !s.revokedAt)).toHaveLength(1);
    });
  });

  describe("PATCH /api/v1/auth/onboarding", () => {
    const completeOnboardingAs = async (body: object) => {
      const newcomer = generateUser({ onboardingCompleted: false });
      await userRepo.save(newcomer);
      const token = await jwtService.sign({ sub: newcomer.id });

      const response = await request(app.getHttpServer())
        .patch("/api/v1/auth/onboarding")
        .set({ Authorization: `Bearer ${token}` })
        .send(body);

      return { newcomer, response };
    };

    test("Should store the intake answers and the confirmed weekly goal", async () => {
      const intake = generateIntakeAnswers();
      const confirmedWeeklyGoal = generateWeeklyGoalMinutes();

      const { newcomer, response } = await completeOnboardingAs({
        firstName: generateUser().firstName,
        enabledModules: [ModuleKey.POMODORO],
        intake,
        weeklyGoalMinutes: confirmedWeeklyGoal,
      });

      expect(response.status).toBe(200);
      const stored = await userRepo.findById(newcomer.id);
      expect(stored!.intake).toEqual(intake);
      expect(stored!.appearance.weeklyGoalMinutes).toBe(confirmedWeeklyGoal);
    });

    test("Should complete onboarding without an intake when the learner skipped it", async () => {
      const { newcomer, response } = await completeOnboardingAs({
        firstName: generateUser().firstName,
        enabledModules: [...DEFAULT_ENABLED_MODULES],
      });

      expect(response.status).toBe(200);
      const stored = await userRepo.findById(newcomer.id);
      expect(stored!.intake).toBeNull();
    });

    test("Should reject an intake with a study style it doesn't offer", async () => {
      const { goals } = generateIntakeAnswers();
      const unknownStudyStyle = ModuleKey.POMODORO;

      const { response } = await completeOnboardingAs({
        firstName: generateUser().firstName,
        enabledModules: [],
        intake: { goals, studyStyle: unknownStudyStyle },
      });

      expect(response.status).toBe(400);
    });
  });
});
