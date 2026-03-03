import { Module } from "@nestjs/common";
import { HealthModule } from "./src/health/health.module.js";

@Module({
  imports: [HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
