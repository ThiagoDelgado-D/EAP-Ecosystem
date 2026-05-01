import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
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
} from "@user/application";
import { BaseError, type CryptoService, type JwtService } from "domain-lib";
import { RequestSignInDto } from "./dto/request/request-sign-in.dto.js";
import { VerifySignInDto } from "./dto/request/verify-sign-in.dto.js";
import { CompleteOnboardingDto } from "./dto/request/complete-onboarding.dto.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import type { Response, Request } from "express";

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
}
