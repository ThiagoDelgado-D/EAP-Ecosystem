import { BaseError } from "domain-lib";

export class InvalidOrExpiredCodeError extends BaseError<"INVALID_OR_EXPIRED_CODE_ERROR"> {
  constructor() {
    super("INVALID_OR_EXPIRED_CODE_ERROR", 401);
  }
}
