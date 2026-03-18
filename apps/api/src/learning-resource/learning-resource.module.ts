import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { LearningResourceController } from "./learning-resource.controller.js";
import { LearningResourceEntity } from "@learning-resource/infrastructure";
import { TopicEntity } from "@learning-resource/infrastructure";
import { ResourceTypeEntity } from "@learning-resource/infrastructure";
import {
  TypeOrmLearningResourceRepository,
  TypeOrmTopicRepository,
  TypeOrmResourceTypeRepository,
} from "@learning-resource/infrastructure";
import { CryptoServiceImpl } from "infrastructure-lib";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningResourceEntity,
      TopicEntity,
      ResourceTypeEntity,
    ]),
  ],
  controllers: [LearningResourceController],
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
  ],
})
export class LearningResourceModule {}
