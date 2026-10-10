import { describe, expect, test } from "vitest";
import { TooManyRequestsError } from "../errors/generic-errors/too-many-requests-error.js";
import { assertRateLimit, exponentialBackoff } from "./rate-limit.js";

const ONE_MINUTE_MS = 60_000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const BACKOFF = { baseDelayMs: ONE_MINUTE_MS, maxDelayMs: ONE_HOUR_MS };
const THIRD_ATTEMPT_DELAY_MS = 4 * ONE_MINUTE_MS;
const ATTEMPTS_PAST_THE_CAP = 20;

const millisecondsAgo = (ms: number) => new Date(Date.now() - ms);

const checkRateLimit = (attempts: number, lastAttemptAt: Date) =>
  assertRateLimit({
    attempts,
    lastAttemptAt,
    baseDelayMs: BACKOFF.baseDelayMs,
    maxDelayMs: BACKOFF.maxDelayMs,
  });

describe("exponentialBackoff", () => {
  test("Should return the base delay for the first attempt", () => {
    expect(exponentialBackoff(0, BACKOFF.baseDelayMs, BACKOFF.maxDelayMs)).toBe(
      ONE_MINUTE_MS,
    );
  });

  test("Should double the delay on each attempt", () => {
    expect(exponentialBackoff(2, BACKOFF.baseDelayMs, BACKOFF.maxDelayMs)).toBe(
      THIRD_ATTEMPT_DELAY_MS,
    );
  });

  test("Should never exceed the max delay", () => {
    expect(
      exponentialBackoff(ATTEMPTS_PAST_THE_CAP, BACKOFF.baseDelayMs, BACKOFF.maxDelayMs),
    ).toBe(ONE_HOUR_MS);
  });
});

describe("assertRateLimit", () => {
  test("Should allow the very first attempt", () => {
    const result = checkRateLimit(0, new Date());

    expect(result).toBeUndefined();
  });

  test("Should allow an attempt once the backoff window has passed", () => {
    const result = checkRateLimit(1, millisecondsAgo(ONE_MINUTE_MS + 1));

    expect(result).toBeUndefined();
  });

  test("Should reject an attempt inside the backoff window", () => {
    const result = checkRateLimit(1, new Date());

    expect(result).toBeInstanceOf(TooManyRequestsError);
  });

  test("Should grow the window with the number of previous attempts", () => {
    const twoMinutesAgo = millisecondsAgo(2 * ONE_MINUTE_MS + 1);

    const afterOneAttempt = checkRateLimit(1, twoMinutesAgo);
    const afterThreeAttempts = checkRateLimit(3, twoMinutesAgo);

    expect(afterOneAttempt).toBeUndefined();
    expect(afterThreeAttempts).toBeInstanceOf(TooManyRequestsError);
  });

  test("Should report the remaining wait in whole seconds", () => {
    const result = checkRateLimit(3, millisecondsAgo(ONE_MINUTE_MS));
    if (!(result instanceof TooManyRequestsError)) throw new Error("Expected a rate limit error");

    const expectedSeconds = (THIRD_ATTEMPT_DELAY_MS - ONE_MINUTE_MS) / 1000;
    expect(result.retryAfterSeconds).toBe(expectedSeconds);
  });
});
