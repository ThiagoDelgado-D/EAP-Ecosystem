import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { LearningPathController } from "./learning-path.controller.js";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  TypeOrmLearningPathRepository,
} from "@learning-resource/infrastructure";
import { CryptoServiceImpl, JwtServiceImpl } from "infrastructure-lib";
import { EnvironmentService } from "../config/environment.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningPathEntity, LearningPathNodeEntity, LearningPathEdgeEntity]),
  ],
  controllers: [LearningPathController],
  providers: [
    {
      provide: "ILearningPathRepository",
      useFactory: (pathRepo, nodeRepo, edgeRepo) =>
        new TypeOrmLearningPathRepository(pathRepo, nodeRepo, edgeRepo),
      inject: [
        getRepositoryToken(LearningPathEntity),
        getRepositoryToken(LearningPathNodeEntity),
        getRepositoryToken(LearningPathEdgeEntity),
      ],
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
  ],
})
export class LearningPathModule {}
