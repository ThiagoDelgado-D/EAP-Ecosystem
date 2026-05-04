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
      useFactory: async (env: EnvironmentService): Promise<EmailServiceImpl> => {
        const templateDir = fileURLToPath(
          new URL("../emails", import.meta.url),
        );
        const tls = { rejectUnauthorized: !env.smtpSkipCertVerify };

        let smtp: SmtpConfig;

        if (env.smtpHost) {
          smtp = {
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpSecure,
            auth: {
              user: env.smtpUser,
              pass: env.smtpPass,
            },
            from: env.smtpFrom,
            tls,
          };
        } else {
          if (env.isProduction) {
            throw new Error(
              "[EmailService] Missing SMTP_HOST in production. Configure SMTP_HOST, SMTP_USER and SMTP_PASS before starting the API.",
            );
          }

          const account = await nodemailer.createTestAccount();
          smtp = {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: account.user, pass: account.pass },
            from: account.user,
            tls,
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
      inject: [EnvironmentService],
    },
  ],
})
export class UserModule {}
