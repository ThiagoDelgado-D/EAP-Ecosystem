import { BaseError } from "domain-lib";

export class SessionForbiddenError extends BaseError<"SESSION_FORBIDDEN_ERROR"> {
  constructor() {
    super("SESSION_FORBIDDEN_ERROR", 403);
  }
}
