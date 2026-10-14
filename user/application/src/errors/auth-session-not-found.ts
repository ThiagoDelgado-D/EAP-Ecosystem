import { BaseError } from "domain-lib";

export class AuthSessionNotFoundError extends BaseError<"AUTH_SESSION_NOT_FOUND_ERROR"> {
  constructor() {
    super("AUTH_SESSION_NOT_FOUND_ERROR", 404);
  }
}
