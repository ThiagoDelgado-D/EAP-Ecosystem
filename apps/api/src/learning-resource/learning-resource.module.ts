import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { LearningResourceController } from "./learning-resource.controller.js";
import {
  LearningResourceEntity,
  TopicEntity,
  ResourceTypeEntity,
  TypeOrmLearningResourceRepository,
  TypeOrmTopicRepository,
  TypeOrmResourceTypeRepository,
  UrlMetadataService,
} from "@learning-resource/infrastructure";
import { CryptoServiceImpl, JwtServiceImpl } from "infrastructure-lib";
import { TopicController } from "./topic.controller.js";
import { ResourceTypeController } from "./resource-type.controller.js";
import { EnvironmentService } from "../config/environment.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningResourceEntity,
      TopicEntity,
      ResourceTypeEntity,
    ]),
  ],
  controllers: [
    LearningResourceController,
    TopicController,
    ResourceTypeController,
  ],
  providers: [
    {
      provide: "ILearningResourceRepository",
      useFactory: (learningResourceRepo, topicRepo) =>
        new TypeOrmLearningResourceRepository(learningResourceRepo, topicRepo),
      inject: [
        getRepositoryToken(LearningResourceEntity),
        getRepositoryToken(TopicEntity),
      ],
    },
    {
      provide: "ITopicRepository",
      useFactory: (repo) => new TypeOrmTopicRepository(repo),
      inject: [getRepositoryToken(TopicEntity)],
    },
    {
      provide: "IResourceTypeRepository",
      useFactory: (repo) => new TypeOrmResourceTypeRepository(repo),
      inject: [getRepositoryToken(ResourceTypeEntity)],
    },
    { provide: "ICryptoService", useClass: CryptoServiceImpl },
    { provide: "IUrlMetadataService", useClass: UrlMetadataService },
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
export class LearningResourceModule {}
