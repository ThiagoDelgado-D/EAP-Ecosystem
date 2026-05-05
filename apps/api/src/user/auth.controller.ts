import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Patch,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type {
  EmailService,
  FeatureKey,
  IIdentityRepository,
  ISessionRepository,
  ISignInChallengeRepository,
  IUserRepository,
} from "@user/domain";
import {
  requestSignIn,
  verifySignIn,
  completeOnboarding,
  handleGoogleOAuth,
  GoogleOAuthError,
} from "@user/application";
import { BaseError, type CryptoService, type JwtService } from "domain-lib";
import { RequestSignInDto } from "./dto/request/request-sign-in.dto.js";
import { VerifySignInDto } from "./dto/request/verify-sign-in.dto.js";
import { CompleteOnboardingDto } from "./dto/request/complete-onboarding.dto.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { EnvironmentService } from "../config/environment.service.js";
import type { Response, Request } from "express";

const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";

@Controller("api/v1/auth")
export class AuthController {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
    @Inject("IIdentityRepository")
    private readonly identityRepository: IIdentityRepository,
    @Inject("ISignInChallengeRepository")
    private readonly signInChallengeRepository: ISignInChallengeRepository,
    @Inject("ISessionRepository")
    private readonly sessionRepository: ISessionRepository,
    @Inject("ICryptoService") private readonly cryptoService: CryptoService,
    @Inject("IJwtService") private readonly jwtService: JwtService,
    @Inject("IEmailService") private readonly emailService: EmailService,
    private readonly env: EnvironmentService,
  ) {}

  @Post("request-sign-in")
  @HttpCode(204)
  async requestSignIn(@Body() dto: RequestSignInDto): Promise<void> {
    await requestSignIn(
      {
        userRepository: this.userRepository,
        signInChallengeRepository: this.signInChallengeRepository,
        cryptoService: this.cryptoService,
        emailService: this.emailService,
      },
      { email: dto.email },
    );
  }

  @Post("verify-sign-in")
  @HttpCode(200)
  async verifySignIn(
    @Body() dto: VerifySignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await verifySignIn(
      {
        userRepository: this.userRepository,
        identityRepository: this.identityRepository,
        signInChallengeRepository: this.signInChallengeRepository,
        sessionRepository: this.sessionRepository,
        cryptoService: this.cryptoService,
        jwtService: this.jwtService,
        emailService: this.emailService,
      },
      { email: dto.email, code: dto.code },
    );
    if (result instanceof BaseError) toHttpException(result);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: result.accessToken, user: result.user };
  }

  @Patch("onboarding")
  @HttpCode(200)
  async completeOnboarding(
    @Body() dto: CompleteOnboardingDto,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) throw new UnauthorizedException();

    const token = authHeader.slice(7);
    const payload = await this.jwtService.verify(token);
    if (!payload?.sub) throw new UnauthorizedException();

    const result = await completeOnboarding(
      { userRepository: this.userRepository },
      {
        userId: payload.sub,
        firstName: dto.firstName,
        featureConfig: dto.featureConfig as FeatureKey[],
      },
    );

    if (result instanceof BaseError) toHttpException(result);
    return result.user;
  }

  @Get("google")
  @Redirect()
  initiateGoogleOAuth(@Res({ passthrough: true }) res: Response) {
    const state = randomBytes(32).toString("hex");
    res.cookie(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.env.isProduction,
      sameSite: "lax",
      path: "/api/v1/auth/google",
      maxAge: 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      client_id: this.env.googleClientId,
      redirect_uri: this.env.googleRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
    });
    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      statusCode: 302,
    };
  }

  @Get("google/callback")
  async googleCallback(
    @Req() req: Request,
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ): Promise<void> {
    const expectedState = this.readCookie(req, GOOGLE_OAUTH_STATE_COOKIE);
    res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, {
      httpOnly: true,
      secure: this.env.isProduction,
      sameSite: "lax",
      path: "/api/v1/auth/google",
    });

    if (!code) {
      res.redirect(`${this.env.webHost}/auth/sign-in?error=oauth_cancelled`);
      return;
    }

    if (!state || !expectedState || state !== expectedState) {
      res.redirect(`${this.env.webHost}/auth/sign-in?error=oauth_state_mismatch`);
      return;
    }

    const result = await handleGoogleOAuth(
      {
        userRepository: this.userRepository,
        identityRepository: this.identityRepository,
        sessionRepository: this.sessionRepository,
        cryptoService: this.cryptoService,
        jwtService: this.jwtService,
      },
      {
        clientId: this.env.googleClientId,
        clientSecret: this.env.googleClientSecret,
        redirectUrl: this.env.googleRedirectUri,
      },
      { code },
    );

    if (result instanceof GoogleOAuthError) {
      res.redirect(`${this.env.webHost}/auth/sign-in?error=oauth_failed`);
      return;
    }

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: this.env.isProduction,
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const params = new URLSearchParams({
      access_token: result.accessToken,
      user_id: result.user.id,
      email: result.user.email,
      first_name: result.user.firstName,
      last_name: result.user.lastName,
      onboarding: String(!result.user.onboardingCompleted),
    });

    res.redirect(`${this.env.webHost}/auth/callback#${params}`);
  }

  private readCookie(req: Request, name: string): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    for (const part of cookieHeader.split(";")) {
      const [rawName, ...rest] = part.trim().split("=");
      if (rawName === name) {
        return decodeURIComponent(rest.join("="));
      }
    }

    return null;
  }
}
