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
import { CryptoServiceImpl, JwtServiceImpl } from "infrastructure-lib";
import { LoggerEmailService } from "../email/logger-email-service.js";

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
    { provide: "IJwtService", useClass: JwtServiceImpl },
    { provide: "IEmailService", useClass: LoggerEmailService },
  ],
})
export class UserModule {}
