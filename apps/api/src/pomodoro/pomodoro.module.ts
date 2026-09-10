import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { PomodoroController } from "./pomodoro.controller.js";
import {
  SegmentEntity,
  SessionEntity,
  TypeOrmSessionRepository,
} from "@pomodoro/infrastructure";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { CryptoServiceImpl, JwtServiceImpl } from "infrastructure-lib";
import { TypeOrmLearningPathMembershipAdapter } from "./typeorm-learning-path-membership-adapter.js";
import { TypeOrmCandidateNodesAdapter } from "./typeorm-candidate-nodes-adapter.js";
import { LoggerNotificationService } from "./logger-notification-service.js";
import { EnvironmentService } from "../config/environment.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionEntity,
      SegmentEntity,
      LearningPathNodeEntity,
      LearningPathEntity,
      LearningPathEdgeEntity,
      LearningResourceEntity,
    ]),
  ],
  controllers: [PomodoroController],
  providers: [
    {
      provide: "IPomodoroSessionRepository",
      useFactory: (sessionRepo, segmentRepo) =>
        new TypeOrmSessionRepository(sessionRepo, segmentRepo),
      inject: [
        getRepositoryToken(SessionEntity),
        getRepositoryToken(SegmentEntity),
      ],
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
