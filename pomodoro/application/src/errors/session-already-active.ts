import { BaseError, type UUID } from "domain-lib";

export class SessionAlreadyActiveError extends BaseError<"SESSION_ALREADY_ACTIVE_ERROR", { activeSessionId: UUID }> {
  constructor(activeSessionId: UUID) {
    super("SESSION_ALREADY_ACTIVE_ERROR", 409, { activeSessionId });
  }
}
