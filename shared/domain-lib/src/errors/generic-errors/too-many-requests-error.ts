import { BaseError } from "../base-error.js";

export class TooManyRequestsError extends BaseError<
  "TOO_MANY_REQUESTS_ERROR",
  { retryAfterSeconds?: number }
> {
  constructor(retryAfterSeconds?: number) {
    super("TOO_MANY_REQUESTS_ERROR", 429, { retryAfterSeconds });
  }
}
