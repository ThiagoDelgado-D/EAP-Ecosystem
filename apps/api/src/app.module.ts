import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { LearningResourceModule } from "./learning-resource/learning-resource.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { ConfigModule } from "@nestjs/config";
import { LoggerMiddleware } from "./middleware/logger-middleware.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    HealthModule,
    LearningResourceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
