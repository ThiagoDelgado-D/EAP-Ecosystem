import { minutes } from "@nestjs/throttler";

export const RATE_LIMITS = {
  GLOBAL: { limit: 120, ttl: minutes(1) },
  REQUEST_SIGN_IN: { limit: 3, ttl: minutes(10) },
  VERIFY_SIGN_IN: { limit: 10, ttl: minutes(10) },
  AUTH_SESSION: { limit: 20, ttl: minutes(1) },
  URL_PREVIEW: { limit: 20, ttl: minutes(1) },
} as const;

export const TOO_MANY_REQUESTS_ERROR = "TOO_MANY_REQUESTS_ERROR";
