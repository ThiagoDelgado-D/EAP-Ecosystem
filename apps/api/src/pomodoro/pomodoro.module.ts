import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { PomodoroController } from "./pomodoro.controller.js";
import {
  BreakEntity,
  SegmentEntity,
  PomodoroSessionEntity,
  TypeOrmBreakRepository,
  TypeOrmSessionRepository,
} from "@pomodoro/infrastructure";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { TypeOrmUserRepository, UserEntity } from "@user/infrastructure";
import { CapabilityKey, type EntitlementsProvider } from "@user/domain";
import { CryptoServiceImpl, JwtServiceImpl } from "infrastructure-lib";
import { TypeOrmLearningPathMembershipAdapter } from "./typeorm-learning-path-membership-adapter.js";
import { TypeOrmCandidateNodesAdapter } from "./typeorm-candidate-nodes-adapter.js";
import { LoggerNotificationService } from "./logger-notification-service.js";
import { EnvironmentService } from "../config/environment.service.js";
import { EntitlementsModule } from "../entitlements/entitlements.module.js";
import { PathStepsCapabilityAdapter } from "../entitlements/path-steps-capability-adapter.js";

@Module({
  imports: [
    EntitlementsModule,
    TypeOrmModule.forFeature([
      PomodoroSessionEntity,
      SegmentEntity,
      BreakEntity,
      LearningPathNodeEntity,
      LearningPathEntity,
      LearningPathEdgeEntity,
      LearningResourceEntity,
      UserEntity,
    ]),
  ],
  controllers: [PomodoroController],
  providers: [
    {
      provide: "IPomodoroSessionRepository",
      useFactory: (sessionRepo, segmentRepo) =>
        new TypeOrmSessionRepository(sessionRepo, segmentRepo),
      inject: [
        getRepositoryToken(PomodoroSessionEntity),
        getRepositoryToken(SegmentEntity),
      ],
    },
    {
      provide: "IPomodoroBreakRepository",
      useFactory: (breakRepo) => new TypeOrmBreakRepository(breakRepo),
      inject: [getRepositoryToken(BreakEntity)],
    },
    {
      provide: "ILearningPathMembershipPort",
      useFactory: (nodeRepo) => new TypeOrmLearningPathMembershipAdapter(nodeRepo),
      inject: [getRepositoryToken(LearningPathNodeEntity)],
    },
    {
      provide: "ICandidateNodesPort",
      useFactory: (pathRepo, nodeRepo, edgeRepo, resourceRepo) =>
        new TypeOrmCandidateNodesAdapter(pathRepo, nodeRepo, edgeRepo, resourceRepo),
      inject: [
        getRepositoryToken(LearningPathEntity),
        getRepositoryToken(LearningPathNodeEntity),
        getRepositoryToken(LearningPathEdgeEntity),
        getRepositoryToken(LearningResourceEntity),
      ],
    },
    {
      provide: "ISessionTargetSourcesPort",
      useFactory: (userRepo, entitlementsProvider: EntitlementsProvider) =>
        new PathStepsCapabilityAdapter(
          new TypeOrmUserRepository(userRepo),
          entitlementsProvider,
          CapabilityKey.POMODORO_PATH_FOCUS,
        ),
      inject: [getRepositoryToken(UserEntity), "IEntitlementsProvider"],
    },
    { provide: "ICryptoService", useClass: CryptoServiceImpl },
    { provide: "INotificationPort", useClass: LoggerNotificationService },
    {
      provide: "IJwtService",
      useFactory: (env: EnvironmentService) =>
        new JwtServiceImpl({
          secret: env.jwtSecret,
          expiresInSeconds: env.jwtExpiresInSeconds,
        }),
      inject: [EnvironmentService],
    },
  ],
})
export class PomodoroModule {}
