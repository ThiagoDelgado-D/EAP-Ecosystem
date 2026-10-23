import type {
  Capabilities,
  EntitlementsProvider,
  ISessionRepository,
  IUserRepository,
  Session,
  User,
} from "@user/domain";
import type { CryptoService, JwtService } from "domain-lib";
import { InvalidOrExpiredCodeError } from "../../errors/invalid-or-expired-code.js";
import { resolveLearnerCapabilities } from "../../utils/resolve-learner-capabilities.js";

export interface RefreshSessionDependencies {
  sessionRepository: ISessionRepository;
  userRepository: IUserRepository;
  cryptoService: CryptoService;
  jwtService: JwtService;
  entitlementsProvider: EntitlementsProvider;
}

export interface RefreshTokenRotationConfig {
  secret: string;
  graceSeconds: number;
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
    | "enabledModules"
  > & { capabilities: Capabilities };
}

export const refreshSession = async (
  {
    sessionRepository,
    userRepository,
    cryptoService,
    jwtService,
    entitlementsProvider,
  }: RefreshSessionDependencies,
  { secret, graceSeconds }: RefreshTokenRotationConfig,
  request: RefreshSessionRequestModel,
): Promise<RefreshSessionResponseModel | InvalidOrExpiredCodeError> => {
  const currentHash = await cryptoService.hashToken(request.rawRefreshToken);
  const session = await sessionRepository.findByRefreshTokenHash(currentHash);
  if (!session || session.expiresAt < new Date()) {
    return new InvalidOrExpiredCodeError();
  }

  const user = await userRepository.findById(session.userId);
  if (!user || !user.enabled) return new InvalidOrExpiredCodeError();

  const replacementToken = await cryptoService.hmacToken(
    request.rawRefreshToken,
    secret,
  );
  const replacementHash = await cryptoService.hashToken(replacementToken);

  if (session.revokedAt == null) {
    const replacement: Session = {
      id: await cryptoService.generateUUID(),
      userId: user.id,
      refreshTokenHash: replacementHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      revokedAt: null,
      userAgent: request.userAgent ? request.userAgent.slice(0, 500) : null,
      ipAddress: request.ipAddress ? request.ipAddress.slice(0, 45) : null,
      createdAt: new Date(),
    };
    const rotated = await sessionRepository.rotate(session.id, replacement);
    if (rotated) {
      return issueTokens(jwtService, entitlementsProvider, user, replacementToken);
    }
  }

  const rotatedSession = await sessionRepository.findById(session.id);
  if (!rotatedSession?.rotatedAt || !rotatedSession.replacedBySessionId) {
    return new InvalidOrExpiredCodeError();
  }

  const graceEndsAt = rotatedSession.rotatedAt.getTime() + graceSeconds * 1000;
  if (Date.now() > graceEndsAt) return new InvalidOrExpiredCodeError();

  const replacement = await sessionRepository.findById(
    rotatedSession.replacedBySessionId,
  );
  if (
    !replacement ||
    replacement.revokedAt != null ||
    replacement.refreshTokenHash !== replacementHash
  ) {
    return new InvalidOrExpiredCodeError();
  }

  return issueTokens(jwtService, entitlementsProvider, user, replacementToken);
};

const issueTokens = async (
  jwtService: JwtService,
  entitlementsProvider: EntitlementsProvider,
  user: User,
  refreshToken: string,
): Promise<RefreshSessionResponseModel> => ({
  accessToken: await jwtService.sign({ sub: user.id }),
  refreshToken,
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    onboardingCompleted: user.onboardingCompleted,
    enabledModules: user.enabledModules,
    capabilities: await resolveLearnerCapabilities(entitlementsProvider, user),
  },
});
