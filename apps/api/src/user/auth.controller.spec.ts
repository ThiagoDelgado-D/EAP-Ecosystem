import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { TooManyRequestsError, type TemplateSendEmailOptions } from "domain-lib";
import { SIGN_IN_REQUEST_BACKOFF } from "@user/domain";
import {
  generateEmail,
  generateMalformedEmail,
} from "@user/application";
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
});
