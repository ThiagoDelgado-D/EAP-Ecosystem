import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { RecommendationController } from "./recommendation.controller.js";
import {
  RecommendationContextEntity,
  TypeOrmRecommendationContextRepository,
} from "@recommendation/infrastructure";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { JwtServiceImpl } from "infrastructure-lib";
import { TypeOrmLearningResourceCandidatesAdapter } from "./typeorm-learning-resource-candidates-adapter.js";
import { TypeOrmLearningPathCandidatesAdapter } from "./typeorm-learning-path-candidates-adapter.js";
import { EnvironmentService } from "../config/environment.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecommendationContextEntity,
      LearningPathEntity,
      LearningPathNodeEntity,
      LearningPathEdgeEntity,
      LearningResourceEntity,
    ]),
  ],
  controllers: [RecommendationController],
  providers: [
    {
      provide: "IRecommendationContextRepository",
      useFactory: (contextRepo) =>
        new TypeOrmRecommendationContextRepository(contextRepo),
      inject: [getRepositoryToken(RecommendationContextEntity)],
    },
    {
      provide: "ILearningResourceCandidatesPort",
      useFactory: (resourceRepo) =>
        new TypeOrmLearningResourceCandidatesAdapter(resourceRepo),
      inject: [getRepositoryToken(LearningResourceEntity)],
    },
    {
      provide: "ILearningPathCandidatesPort",
      useFactory: (pathRepo, nodeRepo, edgeRepo, resourceRepo) =>
        new TypeOrmLearningPathCandidatesAdapter(
          pathRepo,
          nodeRepo,
          edgeRepo,
          resourceRepo,
        ),
      inject: [
        getRepositoryToken(LearningPathEntity),
        getRepositoryToken(LearningPathNodeEntity),
        getRepositoryToken(LearningPathEdgeEntity),
        getRepositoryToken(LearningResourceEntity),
      ],
    },
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
export class RecommendationModule {}
