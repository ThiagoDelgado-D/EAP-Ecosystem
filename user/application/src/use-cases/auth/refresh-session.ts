import type {
  ISessionRepository,
  IUserRepository,
  Session,
  User,
} from "@user/domain";
import type { CryptoService, JwtService } from "domain-lib";
import { InvalidOrExpiredCodeError } from "../../errors/invalid-or-expired-code.js";

export interface RefreshSessionDependencies {
  sessionRepository: ISessionRepository;
  userRepository: IUserRepository;
  cryptoService: CryptoService;
  jwtService: JwtService;
}

export interface RefreshSessionRequestModel {
  rawRefreshToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RefreshSessionResponseModel {
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

export const refreshSession = async (
  {
    sessionRepository,
    userRepository,
    cryptoService,
    jwtService,
  }: RefreshSessionDependencies,
  request: RefreshSessionRequestModel,
): Promise<RefreshSessionResponseModel | InvalidOrExpiredCodeError> => {
  const currentHash = await cryptoService.hashToken(request.rawRefreshToken);
  const session = await sessionRepository.findByRefreshTokenHash(currentHash);

  if (!session || session.revokedAt != null || session.expiresAt < new Date()) {
    return new InvalidOrExpiredCodeError();
  }

  const user = await userRepository.findById(session.userId);
  if (!user || !user.enabled) return new InvalidOrExpiredCodeError();

  const accessToken = await jwtService.sign({ sub: user.id });
  const rawRefreshToken = await cryptoService.generateRandomToken();
  const refreshTokenHash = await cryptoService.hashToken(rawRefreshToken);

  await sessionRepository.revoke(session.id);

  const newSession: Session = {
    id: await cryptoService.generateUUID(),
    userId: user.id,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    revokedAt: null,
    userAgent: request.userAgent ? request.userAgent.slice(0, 500) : null,
    ipAddress: request.ipAddress ? request.ipAddress.slice(0, 45) : null,
    createdAt: new Date(),
  };
  await sessionRepository.save(newSession);

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
