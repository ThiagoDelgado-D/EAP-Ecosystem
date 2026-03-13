import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { LearningResourceModule } from "./learning-resource/learning-resource.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    HealthModule,
    LearningResourceModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
