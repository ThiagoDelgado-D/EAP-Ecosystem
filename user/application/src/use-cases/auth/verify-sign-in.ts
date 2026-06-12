import type {
  Identity,
  IIdentityRepository,
  ISessionRepository,
  ISignInChallengeRepository,
  IUserRepository,
  Session,
  User,
} from "@user/domain";
import { DEFAULT_APPEARANCE } from "@user/domain";
import type { CryptoService, EmailService, JwtService } from "domain-lib";
import { createValidationSchema, emailField, stringField } from "domain-lib";
import { InvalidOrExpiredCodeError } from "../../errors/invalid-or-expired-code.js";

export interface VerifySignInDependencies {
  userRepository: IUserRepository;
  identityRepository: IIdentityRepository;
  signInChallengeRepository: ISignInChallengeRepository;
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
  jwtService: JwtService;
  emailService: EmailService;
}

export interface VerifySignInRequestModel {
  email: string;
  code: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface VerifySignInResponseModel {
  accessToken: string;
  refreshToken: string;
  user: Pick<
    User,
    | "id"
    | "email"
    | "firstName"
    | "lastName"
    | "onboardingCompleted"
    | "featureConfig"
  >;
}

const verifySignInSchema = createValidationSchema<Pick<VerifySignInRequestModel, "email" | "code">>({
  email: emailField("Email", { required: true }),
  code: stringField("Code", { required: true, minLength: 6, maxLength: 6 }),
});

export const verifySignIn = async (
  {
    userRepository,
    identityRepository,
    signInChallengeRepository,
    sessionRepository,
    cryptoService,
    jwtService,
    emailService,
  }: VerifySignInDependencies,
  request: VerifySignInRequestModel,
): Promise<VerifySignInResponseModel | InvalidOrExpiredCodeError> => {
  const validation = await verifySignInSchema(request);
  if (validation instanceof Error) return new InvalidOrExpiredCodeError();

  const { email, code } = validation;

  const challenge = await signInChallengeRepository.findActiveByEmail(email);

  if (
    !challenge ||
    challenge.consumed ||
    challenge.expiresAt < new Date() ||
    challenge.attempts >= 5
  ) {
    return new InvalidOrExpiredCodeError();
  }

  const isValid = await cryptoService.comparePassword(code, challenge.codeHash);
  if (!isValid) {
    await signInChallengeRepository.incrementAttempts(challenge.id);
    return new InvalidOrExpiredCodeError();
  }

  let user = await userRepository.findByEmail(email);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = {
      id: await cryptoService.generateUUID(),
      email,
      firstName: "",
      lastName: "",
      userName: null,
      enabled: true,
      onboardingCompleted: false,
      featureConfig: [],
      widgetConfig: [],
      appearance: DEFAULT_APPEARANCE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await userRepository.save(user);

    const identity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: user.id,
      provider: "magic-link",
      providerSubject: email,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await identityRepository.save(identity);
  }

  const accessToken = await jwtService.sign({ sub: user.id });
  const rawRefreshToken = await cryptoService.generateRandomToken();
  const refreshTokenHash = await cryptoService.hashToken(rawRefreshToken);

  const session: Session = {
    id: await cryptoService.generateUUID(),
    userId: user.id,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    revokedAt: null,
    userAgent: request.userAgent ? request.userAgent.slice(0, 500) : null,
    ipAddress: request.ipAddress ? request.ipAddress.slice(0, 45) : null,
    createdAt: new Date(),
  };
  await sessionRepository.save(session);

  await signInChallengeRepository.consume(challenge.id);

  if (isNewUser) {
    void emailService
      .sendTemplateEmail({
        template: "WELCOME",
        data: {
          firstName: user.firstName,
          year: new Date().getFullYear(),
        },
        to: [email],
      })
      .catch(() => undefined);
  }

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      onboardingCompleted: user.onboardingCompleted,
      featureConfig: user.featureConfig,
    },
  };
};
