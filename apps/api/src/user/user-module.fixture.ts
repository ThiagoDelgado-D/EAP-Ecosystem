import { ValidationPipe, type INestApplication, type ModuleMetadata } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  MockedEmailService,
  mockAccountStatsPort,
  mockIdentityRepository,
  mockSessionRepository,
  mockSignInChallengeRepository,
  mockUserRepository,
} from "@user/application";
import {
  IdentityEntity,
  SessionEntity,
  SignInChallengeEntity,
  UserEntity,
} from "@user/infrastructure";
import {
  LearningPathEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { PomodoroSessionEntity } from "@pomodoro/infrastructure";
import { mockJwtService, type MockedJwtService } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { UserModule } from "./user.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";
import { EnvironmentService } from "../config/environment.service.js";

const testEnvironment = {
  isProduction: false,
  isDevelopment: true,
  webHost: "http://localhost:4200",
  googleClientId: "test-client-id",
  googleClientSecret: "test-client-secret",
  googleRedirectUri: "http://localhost:3000/api/v1/auth/google/callback",
} as unknown as EnvironmentService;

export interface UserTestApp {
  app: INestApplication;
  cryptoService: CryptoServiceImpl;
  challengeRepo: ReturnType<typeof mockSignInChallengeRepository>;
  userRepo: ReturnType<typeof mockUserRepository>;
  identityRepo: ReturnType<typeof mockIdentityRepository>;
  sessionRepo: ReturnType<typeof mockSessionRepository>;
  emailService: MockedEmailService;
  jwtService: MockedJwtService;
}

export async function createUserTestApp(
  extraImports: ModuleMetadata["imports"] = [],
): Promise<UserTestApp> {
  const cryptoService = new CryptoServiceImpl();
  const challengeRepo = mockSignInChallengeRepository();
  const userRepo = mockUserRepository();
  const identityRepo = mockIdentityRepository();
  const sessionRepo = mockSessionRepository();
  const emailService = new MockedEmailService();
  const jwtService = mockJwtService();

  const module = await Test.createTestingModule({
    imports: [UserModule, ...extraImports],
  })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(IdentityEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(SignInChallengeEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(SessionEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(LearningResourceEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(LearningPathEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(PomodoroSessionEntity))
    .useValue({})
    .overrideProvider("IUserRepository")
    .useValue(userRepo)
    .overrideProvider("IIdentityRepository")
    .useValue(identityRepo)
    .overrideProvider("ISignInChallengeRepository")
    .useValue(challengeRepo)
    .overrideProvider("ISessionRepository")
    .useValue(sessionRepo)
    .overrideProvider("IAccountStatsPort")
    .useValue(mockAccountStatsPort())
    .overrideProvider("ICryptoService")
    .useValue(cryptoService)
    .overrideProvider("IJwtService")
    .useValue(jwtService)
    .overrideProvider("IEmailService")
    .useValue(emailService)
    .overrideProvider(EnvironmentService)
    .useValue(testEnvironment)
    .compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();

  return {
    app,
    cryptoService,
    challengeRepo,
    userRepo,
    identityRepo,
    sessionRepo,
    emailService,
    jwtService,
  };
}
