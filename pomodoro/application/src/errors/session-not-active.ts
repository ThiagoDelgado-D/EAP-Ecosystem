import { BaseError, type UUID } from "domain-lib";

export class SessionNotActiveError extends BaseError<"SESSION_NOT_ACTIVE_ERROR", { sessionId: UUID }> {
  constructor(sessionId: UUID) {
    super("SESSION_NOT_ACTIVE_ERROR", 409, { sessionId });
  }
}
