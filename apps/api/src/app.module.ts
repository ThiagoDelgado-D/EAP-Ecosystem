import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { LearningResourceModule } from "./learning-resource/learning-resource.module.js";

@Module({
  imports: [HealthModule, LearningResourceModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
