import { TooManyRequestsError } from "../errors/generic-errors/too-many-requests-error.js";

export interface RateLimitCheck {
  attempts: number;
  lastAttemptAt: Date;
  baseDelayMs: number;
  maxDelayMs: number;
}

export function exponentialBackoff(
  attempts: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  return Math.min(baseDelayMs * 2 ** attempts, maxDelayMs);
}

export function assertRateLimit({
  attempts,
  lastAttemptAt,
  baseDelayMs,
  maxDelayMs,
}: RateLimitCheck): TooManyRequestsError | undefined {
  if (attempts === 0) return undefined;

  const requiredDelayMs = exponentialBackoff(attempts - 1, baseDelayMs, maxDelayMs);
  const remainingMs = lastAttemptAt.getTime() + requiredDelayMs - Date.now();
  if (remainingMs <= 0) return undefined;

  return new TooManyRequestsError(Math.ceil(remainingMs / 1000));
}
