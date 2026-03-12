import { Module } from "@nestjs/common";
import {
  learningResourceRepository,
  topicRepository,
  resourceTypeRepository,
} from "@learning-resource/infrastructure";
import { CryptoServiceImpl } from "infrastructure-lib";
import { LearningResourceController } from "./learning-resource.controller.js";

@Module({
  controllers: [LearningResourceController],
  providers: [
    {
      provide: "ILearningResourceRepository",
      useValue: learningResourceRepository,
    },
    {
      provide: "ITopicRepository",
      useValue: topicRepository,
    },
    {
      provide: "IResourceTypeRepository",
      useValue: resourceTypeRepository,
    },
    { provide: "ICryptoService", useValue: CryptoServiceImpl },
  ],
})
export class LearningResourceModule {}
