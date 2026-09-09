import { BaseError, type UUID } from "domain-lib";

export class SessionNotActiveError extends BaseError<"SESSION_NOT_ACTIVE_ERROR"> {
  constructor(sessionId: UUID) {
    super("SESSION_NOT_ACTIVE_ERROR", 409, { sessionId });
  }
}
