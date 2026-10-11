import { BaseError, type UUID } from "domain-lib";

export class SessionStillActiveError extends BaseError<"SESSION_STILL_ACTIVE_ERROR", { activeSessionId: UUID }> {
  constructor(activeSessionId: UUID) {
    super("SESSION_STILL_ACTIVE_ERROR", 409, { activeSessionId });
  }
}
