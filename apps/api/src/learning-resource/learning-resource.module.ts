import { Module } from "@nestjs/common";
import {
  learningResourceRepository,
  topicRepository,
  resourceTypeRepository,
} from "@learning-resource/infrastructure";

@Module({
  controllers: [],
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
  ],
})
export class LearningResourceModule {}
