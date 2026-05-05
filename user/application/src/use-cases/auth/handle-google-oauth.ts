import type {
  Identity,
  IIdentityRepository,
  ISessionRepository,
  IUserRepository,
  User,
  Session,
} from "@user/domain";
import type { CryptoService, JwtService } from "domain-lib";

export interface HandleGoogleOAuthDependencies {
  userRepository: IUserRepository;
  identityRepository: IIdentityRepository;
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
  jwtService: JwtService;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
}

export interface HandleGoogleOAuthRequestModel {
  code: string;
}

export interface HandleGoogleOAuthResponseModel {
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

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserProfile {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  verified_email?: boolean;
}

export const handleGoogleOAuth = async (
  {
    cryptoService,
    identityRepository,
    jwtService,
    sessionRepository,
    userRepository,
  }: HandleGoogleOAuthDependencies,
  { clientId, clientSecret, redirectUrl }: GoogleOAuthConfig,
  request: HandleGoogleOAuthRequestModel,
): Promise<HandleGoogleOAuthResponseModel | GoogleOAuthError> => {
  const timeoutMs = 5000;
  const tokenResult = await thisFetchWithTimeout<GoogleTokenResponse>(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: request.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUrl,
        grant_type: "authorization_code",
      }),
    },
    timeoutMs,
    "Failed to exchange authorization code",
  );
  if (tokenResult instanceof GoogleOAuthError) return tokenResult;

  const profileResult = await thisFetchWithTimeout<GoogleUserProfile>(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenResult.access_token}` },
    },
    timeoutMs,
    "Failed to fetch Google user profile",
  );
  if (profileResult instanceof GoogleOAuthError) return profileResult;

  const profile = profileResult;

  const existingIdentity = await identityRepository.findByProvider(
    "google",
    profile.id,
  );

  let user: User;

  if (existingIdentity) {
    const found = await userRepository.findById(existingIdentity.userId);
    if (!found)
      return new GoogleOAuthError("User not found for existing identity");
    user = found;
  } else {
    let existingUser: User | null = null;

    if (profile.verified_email === true) {
      existingUser = await userRepository.findByEmail(profile.email);
    }

    if (!existingUser) {
      existingUser = {
        id: await cryptoService.generateUUID(),
        email: profile.email,
        firstName: profile.given_name ?? "",
        lastName: profile.family_name ?? "",
        userName: null,
        enabled: true,
        onboardingCompleted: false,
        featureConfig: [],
        widgetConfig: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await userRepository.save(existingUser);
    }

    user = existingUser;

    const newIdentity: Identity = {
      id: await cryptoService.generateUUID(),
      userId: user.id,
      provider: "google",
      providerSubject: profile.id,
      verified: profile.verified_email ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await identityRepository.save(newIdentity);
  }

  const accessToken = await jwtService.sign({ sub: user.id });
  const rawRefreshToken = await cryptoService.generateRandomToken();
  const refreshTokenHash = await cryptoService.hashToken(rawRefreshToken);

  const session: Session = {
    id: await cryptoService.generateUUID(),
    userId: user.id,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
  };
  await sessionRepository.save(session);

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

export class GoogleOAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleOAuthError";
  }
}

async function thisFetchWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  errorMessage: string,
): Promise<T | GoogleOAuthError> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      return new GoogleOAuthError(errorMessage);
    }

    try {
      return (await response.json()) as T;
    } catch {
      return new GoogleOAuthError(errorMessage);
    }
  } catch {
    return new GoogleOAuthError(errorMessage);
  } finally {
    clearTimeout(timeout);
  }
}
