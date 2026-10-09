import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppThrottlerGuard } from "./app-throttler.guard.js";
import { RATE_LIMITS } from "./rate-limits.js";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: "default",
        limit: RATE_LIMITS.GLOBAL.limit,
        ttl: RATE_LIMITS.GLOBAL.ttl,
      },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class RateLimitModule {}
