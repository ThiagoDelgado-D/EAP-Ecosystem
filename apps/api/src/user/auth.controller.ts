import { Body, Controller, HttpCode, Inject, Post, Res } from "@nestjs/common";
import type {
  EmailService,
  IIdentityRepository,
  ISessionRepository,
  ISignInChallengeRepository,
  IUserRepository,
} from "@user/domain";
import { requestSignIn, verifySignIn } from "@user/application";
import { BaseError, type CryptoService, type JwtService } from "domain-lib";
import type { RequestSignInDto } from "./dto/request/request-sign-in.dto.js";
import type { VerifySignInDto } from "./dto/request/verify-sign-in.dto.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import type { Response } from "express";

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
}
