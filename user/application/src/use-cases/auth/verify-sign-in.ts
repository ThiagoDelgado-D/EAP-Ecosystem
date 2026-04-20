import type {
  Identity,
  IIdentityRepository,
  ISessionRepository,
  ISignInChallengeRepository,
  IUserRepository,
  Session,
  User,
} from "@user/domain";
import type { CryptoService, JwtService } from "domain-lib";
import { createValidationSchema, emailField, stringField } from "domain-lib";
import { InvalidOrExpiredCodeError } from "../../errors/invalid-or-expired-code.js";

export interface VerifySignInDependencies {
  userRepository: IUserRepository;
  identityRepository: IIdentityRepository;
  signInChallengeRepository: ISignInChallengeRepository;
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
  jwtService: JwtService;
}

export interface VerifySignInRequestModel {
  email: string;
  code: string;
}

export interface VerifySignInResponseModel {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, "id" | "email" | "firstName" | "lastName">;
}

const verifySignInSchema = createValidationSchema<VerifySignInRequestModel>({
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
  }: VerifySignInDependencies,
  input: VerifySignInRequestModel,
): Promise<VerifySignInResponseModel | InvalidOrExpiredCodeError> => {
  const validation = await verifySignInSchema(input);
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

  if (!user) {
    user = {
      id: await cryptoService.generateUUID(),
      email,
      firstName: "",
      lastName: "",
      userName: null,
      enabled: true,
      featureConfig: [],
      widgetConfig: [],
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
    createdAt: new Date(),
  };
  await sessionRepository.save(session);

  await signInChallengeRepository.consume(challenge.id);

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
};
