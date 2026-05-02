import { fileURLToPath } from "url";
import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import {
  IdentityEntity,
  SessionEntity,
  SignInChallengeEntity,
  TypeOrmIdentityRepository,
  TypeOrmSessionRepository,
  TypeOrmSignInChallengeRepository,
  TypeOrmUserRepository,
  UserEntity,
} from "@user/infrastructure";
import { AuthController } from "./auth.controller.js";
import {
  CryptoServiceImpl,
  EmailServiceImpl,
  JwtServiceImpl,
  type SmtpConfig,
} from "infrastructure-lib";
import nodemailer from "nodemailer";
import { EAP_EMAIL_DECLARATIONS } from "../email-templates.js";
import { EnvironmentService } from "../config/environment.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      IdentityEntity,
      SignInChallengeEntity,
      SessionEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: "IUserRepository",
      useFactory: (r) => new TypeOrmUserRepository(r),
      inject: [getRepositoryToken(UserEntity)],
    },
    {
      provide: "IIdentityRepository",
      useFactory: (r) => new TypeOrmIdentityRepository(r),
      inject: [getRepositoryToken(IdentityEntity)],
    },
    {
      provide: "ISignInChallengeRepository",
      useFactory: (r) => new TypeOrmSignInChallengeRepository(r),
      inject: [getRepositoryToken(SignInChallengeEntity)],
    },
    {
      provide: "ISessionRepository",
      useFactory: (r) => new TypeOrmSessionRepository(r),
      inject: [getRepositoryToken(SessionEntity)],
    },
    { provide: "ICryptoService", useClass: CryptoServiceImpl },
    {
      provide: "IJwtService",
      useFactory: (env: EnvironmentService) =>
        new JwtServiceImpl({
          secret: env.jwtSecret,
          expiresInSeconds: env.jwtExpiresInSeconds,
        }),
      inject: [EnvironmentService],
    },
    {
      provide: "IEmailService",
      useFactory: async (): Promise<EmailServiceImpl> => {
        const templateDir = fileURLToPath(
          new URL("../emails", import.meta.url),
        );

        let smtp: SmtpConfig;

        if (process.env.SMTP_HOST) {
          smtp = {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT ?? "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER!,
              pass: process.env.SMTP_PASS!,
            },
            from: process.env.SMTP_FROM,
            tls: { rejectUnauthorized: false },
          };
        } else {
          const account = await nodemailer.createTestAccount();
          smtp = {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: account.user, pass: account.pass },
            from: account.user,
            tls: { rejectUnauthorized: false },
          };
          console.warn(
            "[EmailService] No SMTP_HOST configured — using Ethereal dev account.",
          );
          console.warn(`  Account : ${account.user}`);
          console.warn(
            "  View sent emails at: https://ethereal.email/messages",
          );
        }

        return new EmailServiceImpl(templateDir, EAP_EMAIL_DECLARATIONS, smtp);
      },
    },
  ],
})
export class UserModule {}
