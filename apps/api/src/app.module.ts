import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { LearningResourceModule } from "./learning-resource/learning-resource.module.js";
import { LearningPathModule } from "./learning-path/learning-path.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { ConfigModule } from "@nestjs/config";
import { LoggingInterceptor } from "./interceptors/logging.interceptor.js";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { UserModule } from "./user/user.module.js";
import { AppConfigModule } from "./config/app-config.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AppConfigModule,
    DatabaseModule,
    HealthModule,
    LearningResourceModule,
    LearningPathModule,
    UserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
