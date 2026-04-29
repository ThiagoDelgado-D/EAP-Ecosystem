import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import {
  MockedEmailService,
  mockIdentityRepository,
  mockSessionRepository,
  mockSignInChallengeRepository,
  mockUserRepository,
  type MockedIdentityRepository,
  type MockedSessionRepository,
  type MockedSignInChallengeRepository,
} from "@user/application";
import { mockJwtService, type TemplateSendEmailOptions } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { UserModule } from "./user.module.js";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  IdentityEntity,
  SessionEntity,
  SignInChallengeEntity,
  UserEntity,
} from "@user/infrastructure";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";

describe("AuthController (integration)", () => {
  let app: INestApplication;
  const cryptoService = new CryptoServiceImpl();
  const challengeRepo = mockSignInChallengeRepository();
  const userRepo = mockUserRepository();
  const identityRepo = mockIdentityRepository();
  const sessionRepo = mockSessionRepository();
  const emailService = new MockedEmailService();
  const jwtService = mockJwtService();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(getRepositoryToken(UserEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(IdentityEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(SignInChallengeEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(SessionEntity))
      .useValue({})
      .overrideProvider("IUserRepository")
      .useValue(userRepo)
      .overrideProvider("IIdentityRepository")
      .useValue(identityRepo)
      .overrideProvider("ISignInChallengeRepository")
      .useValue(challengeRepo)
      .overrideProvider("ISessionRepository")
      .useValue(sessionRepo)
      .overrideProvider("ICryptoService")
      .useValue(cryptoService)
      .overrideProvider("IJwtService")
      .useValue(jwtService)
      .overrideProvider("IEmailService")
      .useValue(emailService)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
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
        .send({ email: "test@example.com" })
        .expect(204);

      expect(emailService.hasTemplateEmail("MAGIC_LINK_CODE")).toBe(true);
      expect(challengeRepo.challenges.filter((c) => !c.consumed)).toHaveLength(
        1,
      );
    });

    test("Should invalidate previous challenge when requesting again", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: "test@example.com" })
        .expect(204);

      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: "test@example.com" })
        .expect(204);

      expect(challengeRepo.challenges.filter((c) => !c.consumed)).toHaveLength(
        1,
      );
    });

    test("Should return 400 for invalid email format", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: "not-an-email" })
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
        .send({ email: "test@example.com" })
        .expect(204);

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "test@example.com", code: getCode() })
        .expect(200);

      expect(response.body.accessToken).toBe(jwtService.issuedTokens[0]);
      expect(response.body.user.email).toBe("test@example.com");
    });

    test("Should set refreshToken as HttpOnly cookie", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: "test@example.com" })
        .expect(204);

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "test@example.com", code: getCode() })
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
        .send({ email: "test@example.com" })
        .expect(204);

      const code = getCode();

      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "test@example.com", code })
        .expect(200);

      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "test@example.com", code })
        .expect(400);
    });

    test("Should return 400 for wrong code", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/request-sign-in")
        .send({ email: "test@example.com" })
        .expect(204);

      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "test@example.com", code: "000000" })
        .expect(400);
    });

    test("Should return 400 when no challenge exists", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "test@example.com", code: "123456" })
        .expect(400);
    });

    test("Should return 400 for invalid email format", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "not-an-email", code: "123456" })
        .expect(400);
    });

    test("Should return 400 when code is not 6 digits", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/verify-sign-in")
        .send({ email: "test@example.com", code: "123" })
        .expect(400);
    });
  });
});
