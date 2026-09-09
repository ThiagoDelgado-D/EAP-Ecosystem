import { BaseError } from "domain-lib";

export class SessionNotFoundError extends BaseError<"SESSION_NOT_FOUND_ERROR"> {
  constructor() {
    super("SESSION_NOT_FOUND_ERROR", 404);
  }
}
