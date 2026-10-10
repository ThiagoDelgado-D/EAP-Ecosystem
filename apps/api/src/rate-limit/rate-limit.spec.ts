import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createUserTestApp } from "../user/user-module.fixture.js";
import { RateLimitModule } from "./rate-limit.module.js";
import { RATE_LIMITS, TOO_MANY_REQUESTS_ERROR } from "./rate-limits.js";

const SIGN_IN_EMAIL = "ada@example.com";
const rotatingSignInEmail = (attempt: number) => `ada+${attempt}@example.com`;
const WRONG_SIGN_IN_CODE = "000000";
const TOO_MANY_REQUESTS_STATUS = 429;

describe("Rate limiting (integration)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createUserTestApp([RateLimitModule]));
  });

  afterEach(async () => await app.close());

  const requestSignIn = (email = SIGN_IN_EMAIL) =>
    request(app.getHttpServer())
      .post("/api/v1/auth/request-sign-in")
      .send({ email });

  const verifySignIn = () =>
    request(app.getHttpServer())
      .post("/api/v1/auth/verify-sign-in")
      .send({ email: SIGN_IN_EMAIL, code: WRONG_SIGN_IN_CODE });

  test("Should let sign-in codes through up to the per-IP limit, then answer 429 with Retry-After", async () => {
    for (let attempt = 0; attempt < RATE_LIMITS.REQUEST_SIGN_IN.limit; attempt++) {
      await requestSignIn(rotatingSignInEmail(attempt)).expect(204);
    }

    const blocked = await requestSignIn(
      rotatingSignInEmail(RATE_LIMITS.REQUEST_SIGN_IN.limit),
    ).expect(TOO_MANY_REQUESTS_STATUS);

    expect(blocked.body).toEqual({ error: TOO_MANY_REQUESTS_ERROR });
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
  });

  test("Should stop verifying codes once the attempts limit is reached", async () => {
    await requestSignIn().expect(204);
    for (let attempt = 0; attempt < RATE_LIMITS.VERIFY_SIGN_IN.limit; attempt++) {
      const response = await verifySignIn();
      expect(response.status).not.toBe(TOO_MANY_REQUESTS_STATUS);
    }

    const blocked = await verifySignIn().expect(TOO_MANY_REQUESTS_STATUS);

    expect(blocked.body).toEqual({ error: TOO_MANY_REQUESTS_ERROR });
  });
});
